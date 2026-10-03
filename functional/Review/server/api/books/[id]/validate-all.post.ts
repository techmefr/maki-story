import { loadBook } from '~~/server/utils/books'
import { getDb } from '~~/server/utils/db'
import { logEvent } from '~~/server/utils/log'
import { requireActorMember, requirePermission } from '~~/server/utils/permissions'
import { approveBook, findReviewBook } from '~~/server/utils/review'
import { requireParam } from '~~/server/utils/validate'

const conflict = (message: string): never => {
    throw createError({ statusCode: 409, statusMessage: message })
}

export default defineEventHandler(async (event): Promise<IBook> => {
    const actor = await requirePermission(event, 'books.review')
    const memberId = requireActorMember(actor)
    const bookId = requireParam(event, 'id')
    await getDb().begin(async tx => {
        const book = await findReviewBook(tx, bookId, actor.familyId)
        const [state] = await tx<{ lines: number; missing: number; blocked: number }[]>`
            select count(*)::int as lines,
                count(*) filter (where not exists (
                    select 1 from recordings r where r.line_id = l.id and r.language = ${book.language} and r.status in ('draft', 'submitted', 'approved')
                ))::int as missing,
                count(*) filter (where exists (
                    select 1 from recordings r where r.line_id = l.id and r.language = ${book.language} and r.status = 'changes_requested'
                ))::int as blocked
            from lines l where l.book_id = ${bookId} and l.family_id = ${actor.familyId}
        `
        if (!state || state.lines === 0) {
            return conflict('This book has no line')
        }
        if (state.blocked > 0) {
            return conflict('Some lines are waiting for a new take')
        }
        if (state.missing > 0) {
            return conflict('Some lines have no usable take yet')
        }
        await approveBook(tx, actor.familyId, book, memberId)
    })
    logEvent('Livre validé en entier')
    return loadBook(bookId, actor.familyId)
})
