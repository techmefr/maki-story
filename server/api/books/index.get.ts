import { listBookSummaries } from '../../utils/books'

export default defineEventHandler((): Promise<IBookSummary[]> => listBookSummaries())
