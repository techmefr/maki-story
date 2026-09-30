import { getDb, one } from '../../utils/db'
import { badRequest, isNonEmptyString } from '../../utils/validate'

const MAX_PAGES = 40
const MAX_LINES = 400

export default defineEventHandler(async (event): Promise<{ id: string }> => {
    const body = await readBody<Partial<INewBook>>(event)
    const lines = body.lines ?? []
    const pageFileIds = body.pageFileIds ?? []
    const kind: BookKind = body.kind === 'solo' ? 'solo' : 'multi'
    if (!isNonEmptyString(body.title)) {
        return badRequest('A title is required')
    }
    if (lines.length === 0 || lines.length > MAX_LINES || pageFileIds.length > MAX_PAGES) {
        return badRequest('Invalid lines or pages')
    }
    if (lines.some(line => !isNonEmptyString(line.text))) {
        return badRequest('Every line needs text')
    }
    if (kind === 'solo' && !isNonEmptyString(body.soloMemberId)) {
        return badRequest('A solo book needs a reader')
    }
    const soloMemberId = kind === 'solo' ? (body.soloMemberId ?? null) : null
    const db = getDb()
    return db.begin(async tx => {
        const book = one(await tx<{ id: string }[]>`
            insert into books (title, kind, solo_member_id, status, image_desc)
            values (${body.title!.trim()}, ${kind}, ${soloMemberId}, 'to_record', ${body.imageDesc ?? ''})
            returning id
        `)
        for (const [position, fileId] of pageFileIds.entries()) {
            await tx`insert into book_pages (book_id, position, file_id) values (${book.id}, ${position}, ${fileId})`
        }
        for (const [position, line] of lines.entries()) {
            await tx`
                insert into lines (book_id, position, page_index, character, text, member_id)
                values (${book.id}, ${position}, ${line.pageIndex}, ${line.character.trim()}, ${line.text.trim()}, ${soloMemberId})
            `
        }
        return book
    })
})
