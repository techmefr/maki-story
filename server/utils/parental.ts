import type { Sql } from 'postgres'
import { evaluateAccess } from '../../shared/utils/schedule'

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

export const loadActiveOverride = async (db: Sql, familyId: string, memberId: string): Promise<string | null> => {
    const [row] = await db<{ endsAt: Date }[]>`
        select ends_at from parental_overrides
        where family_id = ${familyId} and child_id = ${memberId} and kind = 'UNLOCK' and starts_at <= now() and ends_at > now()
        order by ends_at desc limit 1
    `
    return row ? row.endsAt.toISOString() : null
}

export const saveOverride = async (db: Sql, familyId: string, childId: string, parentId: string, minutes: number): Promise<string> => {
    const [row] = await db<{ endsAt: Date }[]>`
        insert into parental_overrides (family_id, child_id, kind, starts_at, ends_at, created_by_member_id)
        values (${familyId}, ${childId}, 'UNLOCK', now(), now() + make_interval(mins => ${minutes}), ${parentId})
        returning ends_at
    `
    return row!.endsAt.toISOString()
}

export const accessForMember = async (db: Sql, familyId: string, memberId: string): Promise<IAccessStatus> => {
    if (await loadActiveOverride(db, familyId, memberId)) {
        return { isAllowed: true, reason: null, resumeAt: null }
    }
    const [row] = await db<IScheduleRow[]>`
        select m.role, s.is_enabled, s.weekly, s.timezone, s.is_manual_block, s.manual_until
        from members m left join child_schedules s on s.member_id = m.id
        where m.id = ${memberId} and m.family_id = ${familyId} and m.role = 'child'
    `
    return evaluateAccess(row ? toSchedule(row) : null, Date.now())
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
