import { assertBookOwned, checkText } from '~~/server/utils/bookModel'
import { getDb } from '~~/server/utils/db'
import { requireBookEditor } from '~~/technical/Auth/server/utils/permissions'
import { notFound, requireParam } from '~~/server/utils/validate'

export default defineEventHandler(async (event): Promise<IPanel> => {
    const { familyId } = await requireBookEditor(event)
    const bookId = requireParam(event, 'id')
    const panelId = requireParam(event, 'panelId')
    const body = await readBody<IPanelBody>(event)
    const description = checkText(body.description, 'panel')
    const db = getDb()
    await assertBookOwned(db, bookId, familyId)
    const [panel] = await db<IPanel[]>`
        update panels set description = ${description}
        where id = ${panelId} and book_id = ${bookId} and family_id = ${familyId}
        returning id, page_id, position, description
    `
    return panel ?? notFound('Panel not found')
})
