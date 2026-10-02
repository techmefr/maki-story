import { getDb } from '../../utils/db'
import { loadActor } from '../../utils/permissions'

export default defineEventHandler(async (event): Promise<IMember[]> => {
    const actor = await loadActor(event)
    const members = await getDb()<IMember[]>`
        select id, name, role, color, photo_file_id, status, pin_hash is not null as has_code, code_kind, spoken_languages, app_locale, voice_policy, source_member_id is not null as is_guest, coalesce(code_locked_until > now(), false) as is_code_locked from members
        where family_id = ${actor.familyId} and deleted_at is null order by created_at
    `
    if (actor.memberId === null || actor.role !== 'relative') {
        return members
    }
    return members.map(member => ({ ...member, hasCode: false, codeKind: null, isCodeLocked: false, status: 'active' }))
})
