import { getDb } from '../../../utils/db'
import { loadUploadSession } from '../../../utils/uploads'
import { requirePermission } from '../../../utils/permissions'

export default defineEventHandler(async (event): Promise<{ ok: true }> => {
    const db = getDb()
    const session = await loadUploadSession(db, event, (await requirePermission(event, 'files.upload')).familyId)
    await db`delete from upload_sessions where id = ${session.id}`
    return { ok: true }
})
