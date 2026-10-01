import { getDb } from '../../utils/db'
import { requirePermission } from '../../utils/permissions'

export default defineEventHandler(async (event): Promise<IMessage[]> => {
    const { familyId, role, memberId } = await requirePermission(event, 'messages.list')
    return getDb()<IMessage[]>`
        select id, from_member_id, to_member_id, file_id, mime, duration_ms, listened_at, created_at
        from messages
        where family_id = ${familyId} and deleted_at is null
            and (${role === 'parent'} or from_member_id = ${memberId} or to_member_id = ${memberId})
        order by created_at desc
    `
})
