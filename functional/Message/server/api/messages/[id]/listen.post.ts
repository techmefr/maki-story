import { MESSAGE_LISTEN_WINDOW_HOURS } from '~~/shared/utils/voices'
import { getDb } from '~~/server/utils/db'
import { actorEntry, record } from '~~/server/utils/journal'
import { logEvent } from '~~/server/utils/log'
import { purgeExpiredMessages } from '~~/server/utils/messages'
import { requireActorMember, requirePermission } from '~~/technical/Auth/server/utils/permissions'
import { notFound, requireParam } from '~~/server/utils/validate'

export default defineEventHandler(async (event): Promise<{ ok: boolean; expiresAt: string | null }> => {
    const actor = await requirePermission(event, 'messages.listen')
    const memberId = requireActorMember(actor)
    const id = requireParam(event, 'id')
    const db = getDb()
    await purgeExpiredMessages(db, actor.familyId)
    return db.begin(async tx => {
        const [message] = await tx<{ id: string; fromMemberId: string; toMemberId: string; expiresAt: string | null; status: MessageStatus }[]>`
            select id, from_member_id, to_member_id, expires_at, status from messages
            where id = ${id} and family_id = ${actor.familyId} and deleted_at is null for update
        `
        if (!message) {
            return notFound('Message not found')
        }
        const isRecipient = message.toMemberId === memberId
        const isWatcher = actor.role === 'parent' || message.fromMemberId === memberId
        if (!isRecipient && !isWatcher) {
            return notFound('Message not found')
        }
        if (message.status !== 'ACTIVE') {
            throw createError({ statusCode: 410, statusMessage: 'This message has expired' })
        }
        if (!isRecipient) {
            return { ok: true, expiresAt: message.expiresAt }
        }
        const [started] = await tx<{ expiresAt: string | null }[]>`
            update messages
            set first_listened_at = now(), listened_at = now(), expires_at = case when exists (select 1 from treasures t where t.source_message_id = messages.id and t.deleted_at is null) then null else now() + make_interval(hours => ${MESSAGE_LISTEN_WINDOW_HOURS}) end
            where id = ${id} and family_id = ${actor.familyId} and first_listened_at is null and status = 'ACTIVE'
            returning expires_at
        `
        if (started) {
            await record(event, { ...actorEntry(actor), action: 'message.listened', entityType: 'message', entityId: id, after: { expiresAt: started.expiresAt } }, tx)
            logEvent('Message vocal écouté')
        }
        return { ok: true, expiresAt: started?.expiresAt ?? message.expiresAt }
    })
})
