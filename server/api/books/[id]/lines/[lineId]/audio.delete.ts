import { deleteFiles } from '../../../../../utils/books'
import { getDb } from '../../../../../utils/db'
import { notFound, requireParam } from '../../../../../utils/validate'

export default defineEventHandler(async (event): Promise<{ ok: boolean }> => {
    const bookId = requireParam(event, 'id')
    const lineId = requireParam(event, 'lineId')
    const db = getDb()
    const [previous] = await db<{ audioFileId: string | null }[]>`
        select audio_file_id from lines where id = ${lineId} and book_id = ${bookId}
    `
    if (!previous) {
        return notFound('Line not found')
    }
    await db`update lines set audio_file_id = null, audio_ms = 0 where id = ${lineId}`
    await deleteFiles([previous.audioFileId])
    return { ok: true }
})
