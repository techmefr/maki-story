import { getDb } from '../../../../../utils/db'
import { requireFamily } from '../../../../../utils/family'
import { logEvent } from '../../../../../utils/log'
import { notFound, requireParam } from '../../../../../utils/validate'

export default defineEventHandler(async (event): Promise<{ ok: boolean }> => {
    const familyId = requireFamily(event)
    const bookId = requireParam(event, 'id')
    const lineId = requireParam(event, 'lineId')
    const db = getDb()
    const [previous] = await db<{ audioFileId: string | null }[]>`
        select audio_file_id from lines where id = ${lineId} and book_id = ${bookId} and family_id = ${familyId}
    `
    if (!previous) {
        return notFound('Line not found')
    }
    await db`update lines set audio_file_id = null, audio_ms = 0 where id = ${lineId} and family_id = ${familyId}`
    logEvent('Enregistrement effacé (la phrase sera refaite)')
    return { ok: true }
})
