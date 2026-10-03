import { getDb } from '~~/server/utils/db'
import { requirePermission } from '~~/technical/Auth/server/utils/permissions'

const MAX_NOTIFICATIONS = 50

export default defineEventHandler(async (event): Promise<INotificationList> => {
    const actor = await requirePermission(event, 'notifications.list')
    const isParent = actor.role === 'parent'
    const db = getDb()
    const items = await db<INotification[]>`
        select id, kind, payload, count, read_at is not null as is_read, created_at, updated_at
        from notifications
        where family_id = ${actor.familyId} and (recipient_member_id = ${actor.memberId} or (recipient_member_id is null and ${isParent}))
        order by updated_at desc limit ${MAX_NOTIFICATIONS}
    `
    const [unread] = await db<{ count: number }[]>`
        select count(*)::int as count from notifications
        where family_id = ${actor.familyId} and read_at is null and (recipient_member_id = ${actor.memberId} or (recipient_member_id is null and ${isParent}))
    `
    return { items, unreadCount: unread?.count ?? 0 }
})
