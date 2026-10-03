import { assertBookOwned } from '~~/server/utils/bookModel'
import { getDb } from '~~/server/utils/db'
import { actorEntry, record } from '~~/server/utils/journal'
import { readBookTagBody, setBookTags } from '~~/server/utils/tags'
import { requireParam } from '~~/server/utils/validate'
import { requireBookEditor } from '~~/technical/Auth/server/utils/permissions'

export default defineEventHandler(async (event): Promise<{ tags: string[] }> => {
    const actor = await requireBookEditor(event)
    const { familyId } = actor
    const bookId = requireParam(event, 'id')
    const body = readBookTagBody(await readBody(event))
    const db = getDb()
    await assertBookOwned(db, bookId, familyId)
    await db.begin(tx => setBookTags(tx, familyId, bookId, body))
    await record(event, { ...actorEntry(actor), action: 'book.tags.updated', entityType: 'book', entityId: bookId, after: { count: body.tags.length } })
    return { tags: body.tags }
})
