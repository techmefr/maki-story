import { getDb } from '../../../../../utils/db'
import { assertFilesInFamily, requireFamily } from '../../../../../utils/family'
import { logEvent } from '../../../../../utils/log'
import { badRequest, isNonEmptyString, notFound, requireParam } from '../../../../../utils/validate'

interface IAudioBody {
    fileId?: string
    ms?: number
}

export default defineEventHandler(async (event): Promise<{ ok: boolean }> => {
    const familyId = requireFamily(event)
    const bookId = requireParam(event, 'id')
    const lineId = requireParam(event, 'lineId')
    const body = await readBody<IAudioBody>(event)
    if (!isNonEmptyString(body.fileId)) {
        return badRequest('A file is required')
    }
    const db = getDb()
    const [previous] = await db<{ audioFileId: string | null }[]>`
        select audio_file_id from lines where id = ${lineId} and book_id = ${bookId} and family_id = ${familyId}
    `
    if (!previous) {
        return notFound('Line not found')
    }
    await assertFilesInFamily(db, familyId, [body.fileId])
    await db`
        update lines set audio_file_id = ${body.fileId}, audio_ms = ${Math.round(body.ms ?? 0)}
        where id = ${lineId} and family_id = ${familyId}
    `
    logEvent('Enregistrement sauvegardé')
    return { ok: true }
})
