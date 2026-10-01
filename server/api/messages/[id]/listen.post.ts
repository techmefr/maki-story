import { getDb } from '../../../utils/db'
import { requireFamily } from '../../../utils/family'
import { logEvent } from '../../../utils/log'
import { notFound, requireParam } from '../../../utils/validate'

export default defineEventHandler(async (event): Promise<{ ok: boolean }> => {
    const familyId = requireFamily(event)
    const id = requireParam(event, 'id')
    const db = getDb()
    const [message] = await db<{ id: string }[]>`
        select id from messages where id = ${id} and family_id = ${familyId} and deleted_at is null
    `
    if (!message) {
        return notFound('Message not found')
    }
    await db`update messages set listened_at = now() where id = ${id} and family_id = ${familyId} and listened_at is null`
    logEvent('Message vocal écouté')
    return { ok: true }
})
