import { assertBookOwned, checkPageKind } from '../../../../utils/bookModel'
import { getDb, one } from '../../../../utils/db'
import { requireFamily } from '../../../../utils/family'
import { badRequest, notFound, requireParam } from '../../../../utils/validate'

export default defineEventHandler(async (event): Promise<{ id: string; kind: PageKind; ttsFallback: boolean }> => {
    const familyId = requireFamily(event)
    const bookId = requireParam(event, 'id')
    const pageId = requireParam(event, 'pageId')
    const body = await readBody<IPagePatch>(event)
    const db = getDb()
    await assertBookOwned(db, bookId, familyId)
    const [current] = await db<{ kind: PageKind; ttsFallback: boolean; fileId: string | null }[]>`
        select kind, tts_fallback, file_id from book_pages where id = ${pageId} and book_id = ${bookId} and family_id = ${familyId}
    `
    if (!current) {
        return notFound('Page not found')
    }
    const kind = body.kind === undefined ? current.kind : checkPageKind(body.kind)
    if (current.fileId === null && kind !== 'empty') {
        return badRequest('Only an empty page can have no image')
    }
    const ttsFallback = body.ttsFallback === undefined ? current.ttsFallback : body.ttsFallback === true
    return one(await db<{ id: string; kind: PageKind; ttsFallback: boolean }[]>`
        update book_pages set kind = ${kind}, tts_fallback = ${ttsFallback}
        where id = ${pageId} and family_id = ${familyId}
        returning id, kind, tts_fallback
    `)
})
