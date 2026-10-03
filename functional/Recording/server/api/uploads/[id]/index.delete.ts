import { getDb } from '~~/server/utils/db'
import { loadUploadSession } from '~~/server/utils/uploads'
import { requirePermission } from '~~/server/utils/permissions'

export default defineEventHandler(async (event): Promise<{ ok: true }> => {
    const db = getDb()
    const session = await loadUploadSession(db, event, await requirePermission(event, 'files.upload'))
    await db`delete from upload_sessions where id = ${session.id}`
    return { ok: true }
})
