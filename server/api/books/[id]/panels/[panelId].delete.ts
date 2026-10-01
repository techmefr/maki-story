import { assertBookOwned } from '../../../../utils/bookModel'
import { getDb } from '../../../../utils/db'
import { requireFamily } from '../../../../utils/family'
import { notFound, requireParam } from '../../../../utils/validate'

export default defineEventHandler(async (event): Promise<{ ok: boolean }> => {
    const familyId = requireFamily(event)
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
