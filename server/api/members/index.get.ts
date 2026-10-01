import { getDb } from '../../utils/db'
import { requireFamily } from '../../utils/family'

export default defineEventHandler(async (event): Promise<IMember[]> => {
    const familyId = requireFamily(event)
    return getDb()<IMember[]>`
        select id, name, role, color, photo_file_id, status from members
        where family_id = ${familyId} and deleted_at is null order by created_at
    `
})
