import { assertBookOwned } from '../../../../utils/bookModel'
import { getDb } from '../../../../utils/db'
import { requireFamily } from '../../../../utils/family'
import { notFound, requireParam } from '../../../../utils/validate'

export default defineEventHandler(async (event): Promise<{ ok: boolean }> => {
    const familyId = requireFamily(event)
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
