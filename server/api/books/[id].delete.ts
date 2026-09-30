import { deleteFiles, loadBook } from '../../utils/books'
import { getDb } from '../../utils/db'
import { requireParam } from '../../utils/validate'

export default defineEventHandler(async event => {
    const id = requireParam(event, 'id')
    const book = await loadBook(id)
    await getDb()`delete from books where id = ${id}`
    await deleteFiles([...book.pages.map(page => page.fileId), ...book.lines.map(line => line.audioFileId)])
    return { ok: true }
})
