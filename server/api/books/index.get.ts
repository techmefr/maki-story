import { listBookSummaries } from '../../utils/books'
import { requirePermission } from '../../utils/permissions'

export default defineEventHandler(async (event): Promise<IBookSummary[]> => listBookSummaries(await requirePermission(event, 'books.list')))
