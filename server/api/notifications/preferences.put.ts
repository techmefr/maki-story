import { getDb } from '../../utils/db'
import { requireActorMember, requireAnyPermission } from '../../utils/permissions'
import { badRequest } from '../../utils/validate'
import { NOTIFICATION_KINDS, PREFERENCE_CHANNELS } from '../../../shared/utils/notificationPreferences'

export default defineEventHandler(async (event): Promise<INotificationPreference> => {
    const actor = await requireAnyPermission(event, 'notifications.list')
    const memberId = requireActorMember(actor)
    const body = await readBody<Partial<INotificationPreference>>(event)
    if (!NOTIFICATION_KINDS.includes(body.kind as NotificationKind) || !PREFERENCE_CHANNELS.includes(body.channel as NotificationChannel) || typeof body.isEnabled !== 'boolean') {
        return badRequest('Invalid preference')
    }
    await getDb()`
        insert into notification_preferences (member_id, family_id, kind, channel, is_enabled)
        values (${memberId}, ${actor.familyId}, ${body.kind as NotificationKind}, ${body.channel as NotificationChannel}, ${body.isEnabled})
        on conflict (member_id, kind, channel) do update set is_enabled = excluded.is_enabled, updated_at = now()
    `
    return { kind: body.kind as NotificationKind, channel: body.channel as NotificationChannel, isEnabled: body.isEnabled }
})
