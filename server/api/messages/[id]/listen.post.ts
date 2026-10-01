import { getDb } from '../../../utils/db'
import { logEvent } from '../../../utils/log'
import { requireActorMember, requirePermission } from '../../../utils/permissions'
import { notFound, requireParam } from '../../../utils/validate'

export default defineEventHandler(async (event): Promise<{ ok: boolean }> => {
    const actor = await requirePermission(event, 'messages.listen')
    const memberId = requireActorMember(actor)
    const id = requireParam(event, 'id')
    const db = getDb()
    const [message] = await db<{ id: string }[]>`
        select id from messages
        where id = ${id} and family_id = ${actor.familyId} and to_member_id = ${memberId} and deleted_at is null
    `
    if (!message) {
        return notFound('Message not found')
    }
    await db`update messages set listened_at = now() where id = ${id} and family_id = ${actor.familyId} and listened_at is null`
    logEvent('Message vocal écouté')
    return { ok: true }
})
