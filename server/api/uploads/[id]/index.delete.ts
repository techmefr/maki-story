import { getDb } from '../../../utils/db'
import { requireFamily } from '../../../utils/family'
import { loadUploadSession } from '../../../utils/uploads'

export default defineEventHandler(async (event): Promise<{ ok: true }> => {
    const db = getDb()
    const session = await loadUploadSession(db, event, requireFamily(event))
    await db`delete from upload_sessions where id = ${session.id}`
    return { ok: true }
})
