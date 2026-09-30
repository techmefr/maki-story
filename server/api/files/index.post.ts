import { getDb } from '../../utils/db'
import { badRequest } from '../../utils/validate'

const MAX_FILE_BYTES = 4 * 1024 * 1024
const ALLOWED_PREFIXES = ['image/', 'audio/', 'video/mp4', 'video/webm']

export default defineEventHandler(async (event): Promise<{ id: string }> => {
    const mime = (getHeader(event, 'content-type') ?? '').split(';')[0].trim()
    if (!ALLOWED_PREFIXES.some(prefix => mime.startsWith(prefix))) {
        return badRequest('Unsupported file type')
    }
    const raw = await readRawBody(event, false)
    if (!raw || raw.length === 0) {
        return badRequest('Empty file')
    }
    if (raw.length > MAX_FILE_BYTES) {
        return badRequest('File is too large')
    }
    const [file] = await getDb()<{ id: string }[]>`
        insert into files (mime, data) values (${mime}, ${raw}) returning id
    `
    return file
})
