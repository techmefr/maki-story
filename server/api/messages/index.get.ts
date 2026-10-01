import { getDb } from '../../utils/db'
import { requireFamily } from '../../utils/family'

export default defineEventHandler(async (event): Promise<IMessage[]> => {
    const familyId = requireFamily(event)
    return getDb()<IMessage[]>`
        select id, from_member_id, to_member_id, file_id, mime, duration_ms, listened_at, created_at
        from messages where family_id = ${familyId} and deleted_at is null order by created_at desc
    `
})
