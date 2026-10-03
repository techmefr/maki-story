import { getDb } from '~~/server/utils/db'
import { assertUploadLive, loadUploadSession, toUploadState } from '~~/server/utils/uploads'
import { requirePermission } from '~~/server/utils/permissions'
import type { IUploadState } from '~~/shared/types/upload'

export default defineEventHandler(async (event): Promise<IUploadState> => {
    const db = getDb()
    const session = await loadUploadSession(db, event, await requirePermission(event, 'files.upload'))
    await assertUploadLive(db, session)
    return toUploadState(session)
})
