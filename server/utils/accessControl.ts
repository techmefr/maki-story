import type { Sql } from 'postgres'
import { defaultControls } from '../../shared/utils/accessControl'

interface IControlsRow {
    nightEnabled: boolean
    nightFrom: string
    nightTo: string
    listeningEnabled: boolean
    listeningFrom: string
    listeningTo: string
    homeworkRangeEnabled: boolean
    homeworkFrom: string
    homeworkTo: string
    approvalEnabled: boolean
    timezone: string
}

const toControls = (row: IControlsRow): IAccessControls => ({
    night: { isEnabled: row.nightEnabled, from: row.nightFrom, to: row.nightTo },
    listening: { isEnabled: row.listeningEnabled, from: row.listeningFrom, to: row.listeningTo },
    homework: { isEnabled: row.homeworkRangeEnabled, from: row.homeworkFrom, to: row.homeworkTo },
    isApprovalEnabled: row.approvalEnabled,
    timezone: row.timezone,
})

export const loadControls = async (db: Sql, familyId: string, memberId: string): Promise<IAccessControls | null> => {
    const [row] = await db<IControlsRow[]>`
        select night_enabled, night_from, night_to, listening_enabled, listening_from, listening_to,
            homework_range_enabled, homework_from, homework_to, approval_enabled, timezone
        from access_controls where member_id = ${memberId} and family_id = ${familyId}
    `
    return row ? toControls(row) : null
}

export const loadControlsOrDefault = async (db: Sql, familyId: string, memberId: string): Promise<IAccessControls> => {
    return (await loadControls(db, familyId, memberId)) ?? defaultControls()
}

export const saveControls = async (db: Sql, familyId: string, memberId: string, input: IAccessControls): Promise<void> => {
    await db`
        insert into access_controls (
            member_id, family_id, night_enabled, night_from, night_to, listening_enabled, listening_from, listening_to,
            homework_range_enabled, homework_from, homework_to, approval_enabled, timezone
        ) values (
            ${memberId}, ${familyId}, ${input.night.isEnabled}, ${input.night.from}, ${input.night.to},
            ${input.listening.isEnabled}, ${input.listening.from}, ${input.listening.to},
            ${input.homework.isEnabled}, ${input.homework.from}, ${input.homework.to},
            ${input.isApprovalEnabled}, ${input.timezone}
        )
        on conflict (member_id) do update set
            night_enabled = excluded.night_enabled, night_from = excluded.night_from, night_to = excluded.night_to,
            listening_enabled = excluded.listening_enabled, listening_from = excluded.listening_from, listening_to = excluded.listening_to,
            homework_range_enabled = excluded.homework_range_enabled, homework_from = excluded.homework_from, homework_to = excluded.homework_to,
            approval_enabled = excluded.approval_enabled, timezone = excluded.timezone, updated_at = now()
    `
}
