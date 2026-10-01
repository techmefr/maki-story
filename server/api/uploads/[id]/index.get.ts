import { getDb } from '../../../utils/db'
import { requireFamily } from '../../../utils/family'
import { assertUploadLive, loadUploadSession, toUploadState } from '../../../utils/uploads'
import type { IUploadState } from '../../../../shared/types/upload'

export default defineEventHandler(async (event): Promise<IUploadState> => {
    const db = getDb()
    const session = await loadUploadSession(db, event, requireFamily(event))
    await assertUploadLive(db, session)
    return toUploadState(session)
})
