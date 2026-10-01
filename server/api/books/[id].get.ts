import { assertBookReadable, loadBook } from '../../utils/books'
import { requirePermission } from '../../utils/permissions'
import { requireParam } from '../../utils/validate'

export default defineEventHandler(async (event): Promise<IBook> => {
    const actor = await requirePermission(event, 'books.read')
    const id = requireParam(event, 'id')
    await assertBookReadable(actor, id)
    return loadBook(id, actor.familyId)
})
