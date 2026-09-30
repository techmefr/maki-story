import { loadBook } from '../../utils/books'
import { getDb } from '../../utils/db'
import { logEvent } from '../../utils/log'
import { requireParam } from '../../utils/validate'

export default defineEventHandler(async event => {
    const id = requireParam(event, 'id')
    const book = await loadBook(id)
    await getDb()`update books set deleted_at = now() where id = ${id}`
    logEvent(`Livre archivé (soft delete) : « ${book.title} »`)
    return { ok: true }
})
