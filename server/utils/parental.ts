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

export const accessForMember = async (db: Sql, familyId: string, memberId: string): Promise<IAccessStatus> => {
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
