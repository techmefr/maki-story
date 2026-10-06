import type { Sql } from 'postgres'
import { isValidTimezone } from '../../shared/utils/schedule'
import { notify } from './notifications'

interface IRequestRow {
    id: string
    childId: string
    childName: string
    createdAt: Date
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

export const loadHomeworkGate = async (db: Sql, familyId: string, memberId: string): Promise<THomeworkGate> => {
    const [row] = await db<{ status: string }[]>`
        select status from homework_requests
        where family_id = ${familyId} and child_id = ${memberId}
        order by created_at desc limit 1
    `
    return row?.status === 'pending' || row?.status === 'refused' ? row.status : 'none'
}

export const createHomeworkRequest = async (db: Sql, familyId: string, childId: string): Promise<THomeworkGate> => {
    const [child] = await db<{ name: string }[]>`select name from members where id = ${childId} and family_id = ${familyId}`
    const [created] = await db<{ id: string }[]>`
        insert into homework_requests (family_id, child_id) values (${familyId}, ${childId})
        on conflict (child_id) where status = 'pending' do nothing
        returning id
    `
    if (created) {
        await notify(db, { familyId, recipientMemberId: null, kind: 'homework_request', payload: { childName: child?.name ?? '', childId, requestId: created.id } })
    }
    return 'pending'
}

export const listPendingHomework = async (db: Sql, familyId: string): Promise<IHomeworkRequest[]> => {
    const rows = await db<IRequestRow[]>`
        select r.id, r.child_id, m.name as child_name, r.created_at
        from homework_requests r join members m on m.id = r.child_id
        where r.family_id = ${familyId} and r.status = 'pending' and m.deleted_at is null
        order by r.created_at
    `
    return rows.map(row => ({ id: row.id, childId: row.childId, childName: row.childName, createdAt: row.createdAt.toISOString() }))
}

const timezoneOf = async (db: Sql, familyId: string, childId: string): Promise<string> => {
    const [row] = await db<{ timezone: string }[]>`select timezone from child_schedules where member_id = ${childId} and family_id = ${familyId}`
    return isValidTimezone(row?.timezone) ? row.timezone : 'UTC'
}

export const decideHomework = async (db: Sql, familyId: string, requestId: string, parentId: string, decision: THomeworkDecision): Promise<boolean> => {
    const [request] = await db<{ childId: string }[]>`select child_id from homework_requests where id = ${requestId} and family_id = ${familyId}`
    if (!request) {
        return false
    }
    const timezone = await timezoneOf(db, familyId, request.childId)
    const outcome = await db.begin(async tx => {
        const decided = await tx<{ validUntil: Date | null }[]>`
            update homework_requests
            set status = ${decision}, decided_by_member_id = ${parentId}, decided_at = now(),
                valid_until = case when ${decision} = 'approved' then (date_trunc('day', now() at time zone ${timezone}) + interval '1 day') at time zone ${timezone} end
            where id = ${requestId} and family_id = ${familyId} and status = 'pending'
            returning valid_until
        `
        const [row] = decided
        if (!row) {
            return false
        }
        if (decision === 'approved') {
            await tx`
                insert into parental_overrides (family_id, child_id, kind, starts_at, ends_at, created_by_member_id)
                values (${familyId}, ${request.childId}, 'UNLOCK', now(), ${row.validUntil}, ${parentId})
            `
        }
        return true
    })
    return outcome
}
