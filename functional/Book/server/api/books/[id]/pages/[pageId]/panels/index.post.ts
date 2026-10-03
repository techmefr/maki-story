import { assertBookOwned, checkText } from '~~/server/utils/bookModel'
import { getDb, one } from '~~/server/utils/db'
import { requireBookEditor } from '~~/server/utils/permissions'
import { notFound, requireParam } from '~~/server/utils/validate'

export default defineEventHandler(async (event): Promise<IPanel> => {
    const { familyId } = await requireBookEditor(event)
    const bookId = requireParam(event, 'id')
    const pageId = requireParam(event, 'pageId')
    const body = await readBody<IPanelBody>(event)
    const description = checkText(body.description, 'panel')
    const db = getDb()
    await assertBookOwned(db, bookId, familyId)
    const pages = await db`select 1 from book_pages where id = ${pageId} and book_id = ${bookId} and family_id = ${familyId}`
    if (pages.length === 0) {
        return notFound('Page not found')
    }
    return one(await db<IPanel[]>`
        insert into panels (book_id, family_id, page_id, position, description)
        values (${bookId}, ${familyId}, ${pageId},
            (select coalesce(max(position) + 1, 0) from panels where page_id = ${pageId}), ${description})
        returning id, page_id, position, description
    `)
})
