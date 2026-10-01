import { getDb, one } from '../../utils/db'
import { toUploadState } from '../../utils/uploads'
import type { IUploadSession } from '../../utils/uploads'
import { badRequest } from '../../utils/validate'
import { requirePermission } from '../../utils/permissions'
import type { IUploadState } from '../../../shared/types/upload'
import { UPLOAD_MAX_BYTES, UPLOAD_MIME_PREFIXES, UPLOAD_TTL_HOURS } from '../../../shared/utils/upload'

interface IBody {
    size?: unknown
    mime?: unknown
}

export default defineEventHandler(async (event): Promise<IUploadState> => {
    const actor = await requirePermission(event, 'files.upload')
    const { familyId } = actor
    const body = (await readBody<IBody>(event)) ?? {}
    const size = body.size
    const mime = typeof body.mime === 'string' ? (body.mime.split(';')[0]?.trim() ?? '') : ''
    if (typeof size !== 'number' || !Number.isInteger(size) || size <= 0) {
        return badRequest('Invalid size')
    }
    if (size > UPLOAD_MAX_BYTES) {
        return badRequest('File is too large')
    }
    if (!UPLOAD_MIME_PREFIXES.some(prefix => mime.startsWith(prefix))) {
        return badRequest('Unsupported file type')
    }
    if (!mime.startsWith('audio/')) {
        await requirePermission(event, 'files.upload.image')
    }
    const db = getDb()
    await db`delete from upload_sessions where expires_at < now()`
    const session = one(await db<IUploadSession[]>`
        insert into upload_sessions (family_id, mime, size, expires_at)
        values (${familyId}, ${mime}, ${size}, now() + make_interval(hours => ${UPLOAD_TTL_HOURS}))
        returning id, family_id, mime, size, received
    `)
    return toUploadState(session)
})
