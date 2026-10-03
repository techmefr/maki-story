import { lookupIsbn, normalizeIsbn } from '~~/server/utils/isbn'
import { requirePermission } from '~~/technical/Auth/server/utils/permissions'
import { assertIpBudget, recordIpHit } from '~~/technical/Auth/server/utils/throttle'
import { badRequest, notFound, requireParam } from '~~/server/utils/validate'

const LOOKUPS_PER_WINDOW = 30

export default defineEventHandler(async (event): Promise<IIsbnBook> => {
    await requirePermission(event, 'books.create')
    await assertIpBudget(event, 'isbn-lookup', LOOKUPS_PER_WINDOW)
    await recordIpHit(event, 'isbn-lookup')
    const isbn = normalizeIsbn(requireParam(event, 'isbn'))
    if (isbn === null) {
        return badRequest('Invalid ISBN')
    }
    const book = await lookupIsbn(isbn)
    return book ?? notFound('Book not found')
})
