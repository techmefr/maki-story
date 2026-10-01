import { listBookSummaries, parseBookQuery } from '../../utils/books'
import { requirePermission } from '../../utils/permissions'

export default defineEventHandler(async (event): Promise<IBookSummary[]> => {
    const actor = await requirePermission(event, 'books.list')
    const { items, total } = await listBookSummaries(actor, parseBookQuery(getQuery(event)))
    setResponseHeader(event, 'x-total-count', total)
    return items
})
