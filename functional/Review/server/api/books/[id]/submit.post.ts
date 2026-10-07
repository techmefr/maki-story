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
