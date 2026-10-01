import { listBookSummaries } from '../../utils/books'
import { requireFamily } from '../../utils/family'

export default defineEventHandler((event): Promise<IBookSummary[]> => listBookSummaries(requireFamily(event)))
