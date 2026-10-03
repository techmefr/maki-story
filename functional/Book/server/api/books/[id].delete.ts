import { loadBook } from '~~/server/utils/books'
import { getDb } from '~~/server/utils/db'
import { actorEntry, record } from '~~/server/utils/journal'
import { logEvent } from '~~/server/utils/log'
import { requirePermission } from '~~/server/utils/permissions'
import { requireParam } from '~~/server/utils/validate'

export default defineEventHandler(async event => {
    const actor = await requirePermission(event, 'books.delete')
    const { familyId } = actor
    const id = requireParam(event, 'id')
    const book = await loadBook(id, familyId)
    await getDb()`update books set deleted_at = now() where id = ${id} and family_id = ${familyId}`
    await record(event, { ...actorEntry(actor), action: 'book.deleted', entityType: 'book', entityId: id })
    logEvent(`Livre archivé (soft delete) : « ${book.title} »`)
    return { ok: true }
})
