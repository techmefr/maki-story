import { MESSAGE_LISTEN_WINDOW_HOURS } from '../../../../shared/utils/voices'
import { getDb } from '../../../utils/db'
import { actorEntry, record } from '../../../utils/journal'
import { logEvent } from '../../../utils/log'
import { purgeExpiredMessages } from '../../../utils/messages'
import { requireActorMember, requirePermission } from '../../../utils/permissions'
import { notFound, requireParam } from '../../../utils/validate'

export default defineEventHandler(async (event): Promise<{ ok: boolean; expiresAt: string | null }> => {
    const actor = await requirePermission(event, 'messages.listen')
    const memberId = requireActorMember(actor)
    const id = requireParam(event, 'id')
    const db = getDb()
    await purgeExpiredMessages(db, actor.familyId)
    const [message] = await db<{ id: string; fromMemberId: string; toMemberId: string; expiresAt: string | null; status: MessageStatus }[]>`
        select id, from_member_id, to_member_id, expires_at, status from messages
        where id = ${id} and family_id = ${actor.familyId} and deleted_at is null
    `
    if (!message) {
        return notFound('Message not found')
    }
    const isRecipientChild = actor.role === 'child' && message.toMemberId === memberId
    const isWatcher = actor.role === 'parent' || message.fromMemberId === memberId
    if (!isRecipientChild && !isWatcher) {
        return notFound('Message not found')
    }
    if (message.status !== 'ACTIVE') {
        throw createError({ statusCode: 410, statusMessage: 'This message has expired' })
    }
    if (!isRecipientChild) {
        return { ok: true, expiresAt: message.expiresAt }
    }
    const [started] = await db<{ expiresAt: string }[]>`
        update messages
        set first_listened_at = now(), listened_at = now(), expires_at = now() + make_interval(hours => ${MESSAGE_LISTEN_WINDOW_HOURS})
        where id = ${id} and family_id = ${actor.familyId} and first_listened_at is null and status = 'ACTIVE'
        returning expires_at
    `
    if (started) {
        await record(event, { ...actorEntry(actor), action: 'message.listened', entityType: 'message', entityId: id, after: { expiresAt: started.expiresAt } })
        logEvent('Message vocal écouté')
    }
    return { ok: true, expiresAt: started?.expiresAt ?? message.expiresAt }
})
