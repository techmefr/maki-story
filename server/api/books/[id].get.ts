import { loadBook } from '../../utils/books'
import { requireParam } from '../../utils/validate'

export default defineEventHandler((event): Promise<IBook> => loadBook(requireParam(event, 'id')))
