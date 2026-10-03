import { getDb, one } from '~~/server/utils/db'
import { logEvent } from '~~/server/utils/log'
import { requirePermission } from '~~/server/utils/permissions'
import { badRequest } from '~~/server/utils/validate'

const MAX_FILE_BYTES = 4 * 1024 * 1024
const ALLOWED_PREFIXES = ['image/', 'audio/', 'video/mp4', 'video/webm']

export default defineEventHandler(async (event): Promise<{ id: string }> => {
    const actor = await requirePermission(event, 'files.upload')
    const { familyId } = actor
    const mime = (getHeader(event, 'content-type') ?? '').split(';')[0]?.trim() ?? ''
    if (!ALLOWED_PREFIXES.some(prefix => mime.startsWith(prefix))) {
        return badRequest('Unsupported file type')
    }
    if (!mime.startsWith('audio/')) {
        await requirePermission(event, 'files.upload.image')
    }
    const raw = await readRawBody(event, false)
    if (!raw || raw.length === 0) {
        return badRequest('Empty file')
    }
    if (raw.length > MAX_FILE_BYTES) {
        return badRequest('File is too large')
    }
    const file = one(await getDb()<{ id: string }[]>`
        insert into files (family_id, mime, data, created_by_member_id) values (${familyId}, ${mime}, ${raw}, ${actor.memberId}) returning id
    `)
    logEvent(`Fichier reçu (${mime}, ${Math.round(raw.length / 1024)} Ko)`)
    return file
})
