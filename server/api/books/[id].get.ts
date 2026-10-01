import { loadBook } from '../../utils/books'
import { requireFamily } from '../../utils/family'
import { requireParam } from '../../utils/validate'

export default defineEventHandler((event): Promise<IBook> => loadBook(requireParam(event, 'id'), requireFamily(event)))
