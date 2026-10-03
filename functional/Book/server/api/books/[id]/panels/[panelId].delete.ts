import { assertBookOwned } from '~~/server/utils/bookModel'
import { getDb } from '~~/server/utils/db'
import { requireBookEditor } from '~~/technical/Auth/server/utils/permissions'
import { notFound, requireParam } from '~~/server/utils/validate'

export default defineEventHandler(async (event): Promise<{ ok: boolean }> => {
    const { familyId } = await requireBookEditor(event)
    const bookId = requireParam(event, 'id')
    const panelId = requireParam(event, 'panelId')
    const db = getDb()
    await assertBookOwned(db, bookId, familyId)
    const removed = await db`delete from panels where id = ${panelId} and book_id = ${bookId} and family_id = ${familyId} returning id`
    if (removed.length === 0) {
        return notFound('Panel not found')
    }
    return { ok: true }
})
