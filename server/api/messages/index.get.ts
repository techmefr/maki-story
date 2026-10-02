import { getDb } from '../../utils/db'
import { purgeExpiredMessages } from '../../utils/messages'
import { requirePermission } from '../../utils/permissions'

export default defineEventHandler(async (event): Promise<IMessage[]> => {
    const { familyId, role, memberId } = await requirePermission(event, 'messages.list')
    const db = getDb()
    await purgeExpiredMessages(db, familyId)
    return db<IMessage[]>`
        select id, from_member_id, to_member_id, file_id, mime, duration_ms, kind, status, listened_at, first_listened_at, expires_at, created_at
        from messages
        where family_id = ${familyId} and deleted_at is null and status = 'ACTIVE'
            and (${role === 'parent'} or from_member_id = ${memberId} or to_member_id = ${memberId})
        order by created_at desc
    `
})
