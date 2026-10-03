import { assertBookReadable, loadBook } from '~~/server/utils/books'
import { requirePermission } from '~~/technical/Auth/server/utils/permissions'
import { requireParam } from '~~/server/utils/validate'

export default defineEventHandler(async (event): Promise<IBook> => {
    const actor = await requirePermission(event, 'books.read')
    const id = requireParam(event, 'id')
    await assertBookReadable(actor, id)
    return loadBook(id, actor.familyId, actor.role === 'child')
})
