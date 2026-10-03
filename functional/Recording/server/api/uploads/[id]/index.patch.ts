import { getDb } from '~~/server/utils/db'
import { assertUploadLive, loadUploadSession, toUploadState } from '~~/server/utils/uploads'
import { badRequest } from '~~/server/utils/validate'
import { requirePermission } from '~~/technical/Auth/server/utils/permissions'
import type { IUploadState } from '~~/shared/types/upload'
import { UPLOAD_CHUNK_BYTES, UPLOAD_OFFSET_HEADER } from '~~/shared/utils/upload'

export default defineEventHandler(async (event): Promise<IUploadState> => {
    const actor = await requirePermission(event, 'files.upload')
    const offset = Number(getHeader(event, UPLOAD_OFFSET_HEADER))
    if (!Number.isInteger(offset) || offset < 0) {
        return badRequest('Invalid offset')
    }
    const raw = await readRawBody(event, false)
    if (!raw || raw.length === 0) {
        return badRequest('Empty chunk')
    }
    if (raw.length > UPLOAD_CHUNK_BYTES) {
        return badRequest('Chunk is too large')
    }
    return getDb().begin(async tx => {
        const session = await loadUploadSession(tx, event, actor, true)
        await assertUploadLive(tx, session)
        if (offset + raw.length <= session.received) {
            return toUploadState(session)
        }
        if (offset !== session.received) {
            throw createError({ statusCode: 409, statusMessage: 'Wrong offset', data: toUploadState(session) })
        }
        if (offset + raw.length > session.size) {
            return badRequest('Chunk exceeds declared size')
        }
        await tx`insert into upload_chunks (upload_id, chunk_offset, data) values (${session.id}, ${offset}, ${raw})`
        await tx`update upload_sessions set received = ${offset + raw.length} where id = ${session.id}`
        return toUploadState({ ...session, received: offset + raw.length })
    })
})
