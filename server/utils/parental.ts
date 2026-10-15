import type { Sql } from 'postgres'
import { evaluateControls, isHomeworkHour, nextNightStart, requestKindForReason } from '../../shared/utils/accessControl'
import { evaluateAccess } from '../../shared/utils/schedule'
import { loadControls } from './accessControl'
import { hasApprovedSignIn, isHomeworkFollowed, loadHomeworkGate } from './homework'

interface IScheduleRow {
    role: MemberRole
    isEnabled: boolean | null
    weekly: IDayWindow[] | null
    timezone: string | null
    isManualBlock: boolean | null
    manualUntil: Date | null
}

const toSchedule = (row: IScheduleRow): IChildSchedule | null => {
    if (row.isEnabled === null) {
        return null
    }
    return {
        isEnabled: row.isEnabled,
        weekly: row.weekly ?? [],
        timezone: row.timezone ?? 'UTC',
        isManualBlock: row.isManualBlock ?? false,
        manualUntil: row.manualUntil ? row.manualUntil.toISOString() : null,
    }
}

export const loadSchedule = async (db: Sql, familyId: string, memberId: string): Promise<IChildSchedule | null> => {
    const [row] = await db<IScheduleRow[]>`
        select m.role, s.is_enabled, s.weekly, s.timezone, s.is_manual_block, s.manual_until
        from members m left join child_schedules s on s.member_id = m.id
        where m.id = ${memberId} and m.family_id = ${familyId}
    `
    return row ? toSchedule(row) : null
}

type TOverrideScope = 'all' | 'homework'

export const loadActiveOverride = async (db: Sql, familyId: string, memberId: string, scope: TOverrideScope | null = null): Promise<string | null> => {
    const [row] = await db<{ endsAt: Date }[]>`
        select ends_at from parental_overrides
        where family_id = ${familyId} and child_id = ${memberId} and kind = 'UNLOCK' and starts_at <= now() and ends_at > now()
            and (${scope}::text is null or scope = ${scope}::text)
        order by ends_at desc limit 1
    `
    return row ? row.endsAt.toISOString() : null
}

export const saveOverride = async (db: Sql, familyId: string, childId: string, parentId: string, minutes: number): Promise<string> => {
    const [row] = await db<{ endsAt: Date }[]>`
        insert into parental_overrides (family_id, child_id, kind, scope, starts_at, ends_at, created_by_member_id)
        values (${familyId}, ${childId}, 'UNLOCK', 'all', now(), now() + make_interval(mins => ${minutes}), ${parentId})
        returning ends_at
    `
    return row!.endsAt.toISOString()
}

const ALLOWED_STATUS: IAccessStatus = { isAllowed: true, reason: null, resumeAt: null }

export const accessForMember = async (db: Sql, familyId: string, memberId: string, memberSince = 0): Promise<IAccessStatus> => {
    if (await loadActiveOverride(db, familyId, memberId, 'all')) {
        return ALLOWED_STATUS
    }
    const [row] = await db<IScheduleRow[]>`
        select m.role, s.is_enabled, s.weekly, s.timezone, s.is_manual_block, s.manual_until
        from members m left join child_schedules s on s.member_id = m.id
        where m.id = ${memberId} and m.family_id = ${familyId} and m.role = 'child'
    `
    if (!row) {
        return ALLOWED_STATUS
    }
    const controls = await loadControls(db, familyId, memberId)
    if (controls?.isApprovalEnabled && !(await hasApprovedSignIn(db, familyId, memberId, memberSince))) {
        return { isAllowed: false, reason: 'approval', resumeAt: null }
    }
    const now = Date.now()
    const verdict = evaluateControls(controls, now)
    if (verdict.reason) {
        return { isAllowed: false, reason: verdict.reason, resumeAt: verdict.resumeAt }
    }
    const isHomeworkExcused = (await loadActiveOverride(db, familyId, memberId, 'homework')) !== null
    if (!isHomeworkExcused && isHomeworkHour(controls, now) && (await isHomeworkFollowed(db, familyId, memberId))) {
        return { isAllowed: false, reason: 'homework', resumeAt: null }
    }
    return evaluateAccess(toSchedule(row), now)
}

export const snapshotFor = async (db: Sql, familyId: string, memberId: string, memberSince: number): Promise<IAccessSnapshot> => {
    const status = await accessForMember(db, familyId, memberId, memberSince)
    const kind = requestKindForReason(status.reason)
    const [schedule, controls, overrideUntil, homework] = await Promise.all([
        loadSchedule(db, familyId, memberId),
        loadControls(db, familyId, memberId),
        loadActiveOverride(db, familyId, memberId),
        kind ? loadHomeworkGate(db, familyId, memberId, kind, memberSince) : Promise.resolve<THomeworkGate>('none'),
    ])
    return { ...status, schedule, overrideUntil, homework, controls, nightStartsAt: nextNightStart(controls, Date.now()) }
}

export const saveSchedule = async (db: Sql, familyId: string, memberId: string, input: IScheduleInput): Promise<void> => {
    await db`
        insert into child_schedules (member_id, family_id, is_enabled, weekly, timezone)
        values (${memberId}, ${familyId}, ${input.isEnabled}, ${db.json(input.weekly as never)}, ${input.timezone})
        on conflict (member_id) do update
        set is_enabled = excluded.is_enabled, weekly = excluded.weekly, timezone = excluded.timezone, updated_at = now()
    `
}

export const saveManualBlock = async (db: Sql, familyId: string, memberId: string, isBlocked: boolean, until: Date | null): Promise<void> => {
    await db`
        insert into child_schedules (member_id, family_id, is_manual_block, manual_until)
        values (${memberId}, ${familyId}, ${isBlocked}, ${until})
        on conflict (member_id) do update
        set is_manual_block = excluded.is_manual_block, manual_until = excluded.manual_until, updated_at = now()
    `
}
