import { assertBookOwned, checkPageKind, checkText } from '../../../../utils/bookModel'
import { getDb, one } from '../../../../utils/db'
import { requireBookEditor } from '../../../../utils/permissions'
import { badRequest, notFound, requireParam } from '../../../../utils/validate'

export default defineEventHandler(async (event): Promise<{ id: string; kind: PageKind; ttsFallback: boolean; description: string }> => {
    const { familyId } = await requireBookEditor(event)
    const bookId = requireParam(event, 'id')
    const pageId = requireParam(event, 'pageId')
    const body = await readBody<IPagePatch>(event)
    const db = getDb()
    await assertBookOwned(db, bookId, familyId)
    const [current] = await db<{ kind: PageKind; ttsFallback: boolean; fileId: string | null; description: string }[]>`
        select kind, tts_fallback, file_id, description from book_pages where id = ${pageId} and book_id = ${bookId} and family_id = ${familyId}
    `
    if (!current) {
        return notFound('Page not found')
    }
    const kind = body.kind === undefined ? current.kind : checkPageKind(body.kind)
    if (current.fileId === null && kind !== 'empty') {
        return badRequest('Only an empty page can have no image')
    }
    const ttsFallback = body.ttsFallback === undefined ? current.ttsFallback : body.ttsFallback === true
    const description = body.description === undefined ? current.description : checkText(body.description, 'page description')
    return one(await db<{ id: string; kind: PageKind; ttsFallback: boolean; description: string }[]>`
        update book_pages set kind = ${kind}, tts_fallback = ${ttsFallback}, description = ${description}
        where id = ${pageId} and family_id = ${familyId}
        returning id, kind, tts_fallback, description
    `)
})
