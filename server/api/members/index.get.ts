import { getDb } from '../../utils/db'
import { memberExtras } from '../../utils/members'
import { requirePermission } from '../../utils/permissions'

export default defineEventHandler(async (event): Promise<IMember[]> => {
    const { familyId, role, memberId } = await requirePermission(event, 'members.list')
    const db = getDb()
    return db<IMember[]>`
        select id, name, role, color, photo_file_id, status, pin_hash is not null as has_code, code_kind, spoken_languages, app_locale, voice_policy, source_member_id is not null as is_guest, ${memberExtras(db, role, memberId)}, coalesce(code_locked_until > now(), false) as is_code_locked from members
        where family_id = ${familyId} and deleted_at is null order by created_at
    `
})
