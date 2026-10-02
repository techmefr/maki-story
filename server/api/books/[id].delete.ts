import { loadBook } from '../../utils/books'
import { getDb } from '../../utils/db'
import { actorEntry, record } from '../../utils/journal'
import { logEvent } from '../../utils/log'
import { requirePermission } from '../../utils/permissions'
import { requireParam } from '../../utils/validate'

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
