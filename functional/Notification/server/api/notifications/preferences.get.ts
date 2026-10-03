import { getDb } from '~~/server/utils/db'
import { requireActorMember, requireAnyPermission } from '~~/server/utils/permissions'
import { NOTIFICATION_KINDS, PREFERENCE_CHANNELS } from '~~/shared/utils/notificationPreferences'

export default defineEventHandler(async (event): Promise<INotificationPreference[]> => {
    const actor = await requireAnyPermission(event, 'notifications.list')
    const memberId = requireActorMember(actor)
    const rows = await getDb()<{ kind: NotificationKind; channel: NotificationChannel; isEnabled: boolean }[]>`
        select kind, channel, is_enabled from notification_preferences where member_id = ${memberId} and family_id = ${actor.familyId}
    `
    return NOTIFICATION_KINDS.flatMap(kind =>
        PREFERENCE_CHANNELS.map(channel => ({
            kind,
            channel,
            isEnabled: rows.find(row => row.kind === kind && row.channel === channel)?.isEnabled ?? true,
        })),
    )
})
