import { getDb } from '../../../utils/db'
import { logEvent } from '../../../utils/log'
import { requireActorMember, requirePermission } from '../../../utils/permissions'
import { notFound, requireParam } from '../../../utils/validate'

export default defineEventHandler(async (event): Promise<{ ok: boolean }> => {
    const actor = await requirePermission(event, 'messages.listen')
    const memberId = requireActorMember(actor)
    const id = requireParam(event, 'id')
    const db = getDb()
    const [message] = await db<{ id: string; fromMemberId: string; createdAt: string }[]>`
        select id, from_member_id, created_at from messages
        where id = ${id} and family_id = ${actor.familyId} and to_member_id = ${memberId} and deleted_at is null
    `
    if (!message) {
        return notFound('Message not found')
    }
    if (actor.role === 'child') {
        const [earlier] = await db<{ id: string }[]>`
            select id from messages
            where family_id = ${actor.familyId} and to_member_id = ${memberId} and from_member_id = ${message.fromMemberId}
                and deleted_at is null and listened_at is null and created_at < ${message.createdAt}
            limit 1
        `
        if (earlier) {
            throw createError({ statusCode: 409, statusMessage: 'Listen to the previous message first' })
        }
    }
    await db`update messages set listened_at = now() where id = ${id} and family_id = ${actor.familyId} and listened_at is null`
    logEvent('Message vocal écouté')
    return { ok: true }
})
