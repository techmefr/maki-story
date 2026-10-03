import { assertBookOwned } from '~~/server/utils/bookModel'
import { getDb } from '~~/server/utils/db'
import { requireBookEditor } from '~~/server/utils/permissions'
import { notFound, requireParam } from '~~/server/utils/validate'

export default defineEventHandler(async (event): Promise<{ ok: boolean }> => {
    const { familyId } = await requireBookEditor(event)
    const bookId = requireParam(event, 'id')
    const characterId = requireParam(event, 'characterId')
    const db = getDb()
    await assertBookOwned(db, bookId, familyId)
    const removed = await db`
        delete from characters where id = ${characterId} and book_id = ${bookId} and family_id = ${familyId} returning id
    `
    if (removed.length === 0) {
        return notFound('Character not found')
    }
    return { ok: true }
})
