import { getDb } from '../../utils/db'
import { requirePermission } from '../../utils/permissions'

export default defineEventHandler(async (event): Promise<IMember[]> => {
    const { familyId } = await requirePermission(event, 'members.list')
    return getDb()<IMember[]>`
        select id, name, role, color, photo_file_id, status, pin_hash is not null as has_code, code_kind, spoken_languages, app_locale from members
        where family_id = ${familyId} and deleted_at is null order by created_at
    `
})
