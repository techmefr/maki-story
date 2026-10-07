import { getDb } from '~~/server/utils/db'
import { logEvent } from '~~/server/utils/log'
import { assertBookReadable } from '~~/server/utils/books'
import { requireActorMember, requireRole } from '~~/technical/Auth/server/utils/permissions'
import { findReviewBook, recordSubmission } from '~~/server/utils/review'
import { requireParam } from '~~/server/utils/validate'

export default defineEventHandler(async (event): Promise<ISubmitResult> => {
    const actor = await requireRole(event, 'relative')
    const memberId = requireActorMember(actor)
    const bookId = requireParam(event, 'id')
    await assertBookReadable(actor, bookId)
    const submitted = await getDb().begin(async tx => {
        const book = await findReviewBook(tx, bookId, actor.familyId)
        const [gaps] = await tx<{ missing: number }[]>`
            select count(*)::int as missing from lines l
            where l.book_id = ${bookId} and l.family_id = ${actor.familyId} and not exists (
                select 1 from recordings r where r.line_id = l.id and r.language = ${book.language} and r.status in ('draft', 'submitted', 'approved')
            )
        `
        if (gaps && gaps.missing > 0) {
            throw createError({ statusCode: 409, statusMessage: 'Some lines have no take yet' })
        }
        const rows = await tx`
            update recordings r set status = 'submitted'
            from lines l
            where l.id = r.line_id and l.book_id = ${bookId} and r.family_id = ${actor.familyId} and r.member_id = ${memberId} and r.status = 'draft'
            returning r.id
        `
        if (rows.length > 0) {
            await recordSubmission(tx, { familyId: actor.familyId, book, memberId, count: rows.length, kind: 'submitted' })
        }
        return rows.length
    })
    if (submitted > 0) {
        logEvent(`${submitted} prise(s) envoyée(s) en relecture`)
    }
    return { submitted }
})
