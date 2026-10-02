import { getDb } from '../../utils/db'
import { daysUntilBirthday } from '../../../shared/utils/age'
import { memberExtras } from '../../utils/members'
import { concernedChildIds } from '../../utils/memberships'
import { loadActor } from '../../utils/permissions'

export default defineEventHandler(async (event): Promise<IMember[]> => {
    const actor = await loadActor(event)
    const db = getDb()
    const members = await db<IMember[]>`
        select id, name, role, color, photo_file_id, status, pin_hash is not null as has_code, code_kind, spoken_languages, app_locale, voice_policy, source_member_id is not null as is_guest, ${memberExtras(db, actor.role, actor.memberId)}, coalesce(code_locked_until > now(), false) as is_code_locked from members
        where family_id = ${actor.familyId} and deleted_at is null order by created_at
    `
    const birthdays = await db<{ id: string; birthDate: string; timezone: string }[]>`
        select m.id, m.birth_date::text as birth_date, coalesce(s.timezone, 'UTC') as timezone
        from members m left join child_schedules s on s.member_id = m.id
        where m.family_id = ${actor.familyId} and m.role = 'child' and m.deleted_at is null and m.birth_date is not null
    `
    const daysById = new Map(birthdays.map(row => [row.id, daysUntilBirthday(row.birthDate, row.timezone)]))
    const withBirthdays = members.map(member => ({ ...member, birthdayInDays: daysById.get(member.id) ?? null }))
    if (actor.memberId === null || actor.role !== 'relative') {
        return withBirthdays
    }
    const concerned = await concernedChildIds(db, actor.accountId, actor.familyId)
    return withBirthdays.filter(member => member.role !== 'child' || concerned === null || concerned.includes(member.id)).map(member => ({ ...member, hasCode: false, codeKind: null, isCodeLocked: false, status: 'active' }))
})
