import { loadBook } from '../../utils/books'
import { getDb } from '../../utils/db'
import { logEvent } from '../../utils/log'
import { requirePermission } from '../../utils/permissions'
import { requireParam } from '../../utils/validate'

export default defineEventHandler(async event => {
    const { familyId } = await requirePermission(event, 'books.delete')
    const id = requireParam(event, 'id')
    const book = await loadBook(id, familyId)
    await getDb()`update books set deleted_at = now() where id = ${id} and family_id = ${familyId}`
    logEvent(`Livre archivé (soft delete) : « ${book.title} »`)
    return { ok: true }
})
