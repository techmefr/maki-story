import { getDb } from '../../../utils/db'
import { assertUploadLive, loadUploadSession, toUploadState } from '../../../utils/uploads'
import { requirePermission } from '../../../utils/permissions'
import type { IUploadState } from '../../../../shared/types/upload'

export default defineEventHandler(async (event): Promise<IUploadState> => {
    const db = getDb()
    const session = await loadUploadSession(db, event, (await requirePermission(event, 'files.upload')).familyId)
    await assertUploadLive(db, session)
    return toUploadState(session)
})
