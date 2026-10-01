import { loadBook } from '../../utils/books'
import { getDb } from '../../utils/db'
import { requireFamily } from '../../utils/family'
import { logEvent } from '../../utils/log'
import { requireParam } from '../../utils/validate'

export default defineEventHandler(async event => {
    const familyId = requireFamily(event)
    const id = requireParam(event, 'id')
    const book = await loadBook(id, familyId)
    await getDb()`update books set deleted_at = now() where id = ${id} and family_id = ${familyId}`
    logEvent(`Livre archivé (soft delete) : « ${book.title} »`)
    return { ok: true }
})
