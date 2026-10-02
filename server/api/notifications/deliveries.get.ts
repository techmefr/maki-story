import { getDb } from '../../utils/db'
import { requirePermission } from '../../utils/permissions'

const MAX_DELIVERIES = 100

export interface INotificationDelivery {
    id: string
    memberId: string | null
    kind: NotificationKind
    channel: 'PUSH' | 'EMAIL'
    status: 'SENT' | 'SUPPRESSED' | 'FAILED'
    reason: string
    createdAt: string
}

export default defineEventHandler(async (event): Promise<INotificationDelivery[]> => {
    const { familyId } = await requirePermission(event, 'members.manage')
    return getDb()<INotificationDelivery[]>`
        select id, member_id, kind, channel, status, reason, created_at
        from notification_deliveries where family_id = ${familyId} order by created_at desc, id limit ${MAX_DELIVERIES}
    `
})
