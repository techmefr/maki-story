import type { Sql } from 'postgres'
import { EXCEPTION_MINUTES, MAX_REQUESTS_PER_SLOT, SIGNIN_APPROVAL_HOURS, slotStart } from '../../shared/utils/accessControl'
import { isValidTimezone } from '../../shared/utils/schedule'
import { loadControls } from './accessControl'
import { notify } from './notifications'

interface IRequestRow {
    id: string
    childId: string
    childName: string
    kind: TAccessRequestKind
    createdAt: Date
    expiresAt: Date
}

const NOTIFICATION_KIND: Record<TAccessRequestKind, NotificationKind> = {
    homework: 'homework_request',
    signin: 'signin_request',
    exception: 'exception_request',
}

export const isHomeworkFollowed = async (db: Sql, familyId: string, memberId: string): Promise<boolean> => {
    const [row] = await db<{ homeworkFollow: boolean }[]>`
        select homework_follow from members where id = ${memberId} and family_id = ${familyId} and role = 'child'
    `
    return row?.homeworkFollow ?? false
}

export const saveHomeworkFollow = async (db: Sql, familyId: string, memberId: string, isEnabled: boolean): Promise<void> => {
    await db`update members set homework_follow = ${isEnabled} where id = ${memberId} and family_id = ${familyId}`
}

const expireStale = async (db: Sql, familyId: string, childId: string): Promise<void> => {
    await db`
        update homework_requests set status = 'expired'
        where family_id = ${familyId} and child_id = ${childId} and status = 'pending' and expires_at <= now()
    `
}

export const loadHomeworkGate = async (db: Sql, familyId: string, memberId: string, kind: TAccessRequestKind, memberSince: number): Promise<THomeworkGate> => {
    await expireStale(db, familyId, memberId)
    const controls = await loadControls(db, familyId, memberId)
    const since = new Date(slotStart(kind, controls, Date.now(), memberSince))
    const [row] = await db<{ status: string }[]>`
        select status from homework_requests
        where family_id = ${familyId} and child_id = ${memberId} and kind = ${kind} and created_at >= ${since}
        order by created_at desc limit 1
    `
    return row?.status === 'pending' || row?.status === 'refused' || row?.status === 'expired' ? row.status : 'none'
}

export const hasApprovedSignIn = async (db: Sql, familyId: string, memberId: string, memberSince: number): Promise<boolean> => {
    const [row] = await db<{ id: string }[]>`
        select id from homework_requests
        where family_id = ${familyId} and child_id = ${memberId} and kind = 'signin' and status = 'approved'
            and decided_at >= ${new Date(memberSince)} and decided_at > now() - make_interval(hours => ${SIGNIN_APPROVAL_HOURS})
        limit 1
    `
    return row !== undefined
}

export const createHomeworkRequest = async (db: Sql, familyId: string, childId: string, kind: TAccessRequestKind, memberSince: number): Promise<THomeworkGate> => {
    await expireStale(db, familyId, childId)
    const controls = await loadControls(db, familyId, childId)
    const since = new Date(slotStart(kind, controls, Date.now(), memberSince))
    const [counted] = await db<{ total: number; pending: number }[]>`
        select count(*)::int as total, (count(*) filter (where status = 'pending'))::int as pending
        from homework_requests
        where family_id = ${familyId} and child_id = ${childId} and kind = ${kind} and created_at >= ${since}
    `
    if ((counted?.pending ?? 0) > 0) {
        return 'pending'
    }
    if ((counted?.total ?? 0) >= MAX_REQUESTS_PER_SLOT) {
        return 'refused'
    }
    const [child] = await db<{ name: string }[]>`select name from members where id = ${childId} and family_id = ${familyId}`
    const [created] = await db<{ id: string }[]>`
        insert into homework_requests (family_id, child_id, kind) values (${familyId}, ${childId}, ${kind})
        on conflict (child_id, kind) where status = 'pending' do nothing
        returning id
    `
    if (created) {
        await notify(db, { familyId, recipientMemberId: null, kind: NOTIFICATION_KIND[kind], payload: { childName: child?.name ?? '', childId, requestId: created.id } })
    }
    return 'pending'
}

export const listPendingHomework = async (db: Sql, familyId: string): Promise<IHomeworkRequest[]> => {
    const rows = await db<IRequestRow[]>`
        select r.id, r.child_id, m.name as child_name, r.kind, r.created_at, r.expires_at
        from homework_requests r join members m on m.id = r.child_id
        where r.family_id = ${familyId} and r.status = 'pending' and r.expires_at > now() and m.deleted_at is null
        order by r.created_at
    `
    return rows.map(row => ({
        id: row.id,
        childId: row.childId,
        childName: row.childName,
        kind: row.kind,
        createdAt: row.createdAt.toISOString(),
        expiresAt: row.expiresAt.toISOString(),
    }))
}

const timezoneOf = async (db: Sql, familyId: string, childId: string): Promise<string> => {
    const [row] = await db<{ timezone: string }[]>`select timezone from child_schedules where member_id = ${childId} and family_id = ${familyId}`
    if (isValidTimezone(row?.timezone)) {
        return row.timezone
    }
    const controls = await loadControls(db, familyId, childId)
    return controls?.timezone ?? 'UTC'
}

export const decideHomework = async (db: Sql, familyId: string, requestId: string, parentId: string, decision: THomeworkDecision): Promise<boolean> => {
    const [request] = await db<{ childId: string; kind: TAccessRequestKind }[]>`select child_id, kind from homework_requests where id = ${requestId} and family_id = ${familyId}`
    if (!request) {
        return false
    }
    const timezone = await timezoneOf(db, familyId, request.childId)
    return db.begin(async tx => {
        const decided = await tx<{ validUntil: Date | null }[]>`
            update homework_requests
            set status = ${decision}, decided_by_member_id = ${parentId}, decided_at = now(),
                valid_until = case
                    when ${decision} <> 'approved' then null
                    when kind = 'homework' then (date_trunc('day', now() at time zone ${timezone}) + interval '1 day') at time zone ${timezone}
                    when kind = 'exception' then now() + make_interval(mins => ${EXCEPTION_MINUTES})
                end
            where id = ${requestId} and family_id = ${familyId} and status = 'pending' and expires_at > now()
            returning valid_until
        `
        const [row] = decided
        if (!row) {
            return false
        }
        if (decision === 'approved' && request.kind !== 'signin') {
            await tx`
                insert into parental_overrides (family_id, child_id, kind, scope, starts_at, ends_at, created_by_member_id)
                values (${familyId}, ${request.childId}, 'UNLOCK', ${request.kind === 'homework' ? 'homework' : 'all'}, now(), ${row.validUntil}, ${parentId})
            `
        }
        return true
    })
}

export const requestSignInApproval = async (db: Sql, familyId: string, childId: string, memberSince: number): Promise<void> => {
    const controls = await loadControls(db, familyId, childId)
    if (controls?.isApprovalEnabled) {
        await createHomeworkRequest(db, familyId, childId, 'signin', memberSince)
    }
}
