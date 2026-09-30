import { getDb } from '../../../utils/db'
import { logEvent } from '../../../utils/log'
import { requireParam } from '../../../utils/validate'

export default defineEventHandler(async (event): Promise<{ ok: boolean }> => {
    const id = requireParam(event, 'id')
    await getDb()`update messages set listened_at = now() where id = ${id} and listened_at is null`
    logEvent('Message vocal écouté')
    return { ok: true }
})
