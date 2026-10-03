import { assertBookReadable } from '~~/server/utils/books'
import { getDb } from '~~/server/utils/db'
import { requireRole } from '~~/server/utils/permissions'
import { requireParam } from '~~/server/utils/validate'

export default defineEventHandler(async (event): Promise<IReviewComment[]> => {
    const actor = await requireRole(event, 'parent', 'relative')
    const bookId = requireParam(event, 'id')
    await assertBookReadable(actor, bookId)
    const ownVoice = actor.role === 'relative' ? actor.memberId : null
    return getDb()<IReviewComment[]>`
        select c.id, c.book_id, c.line_id, c.recording_id, c.author_member_id, c.body, c.created_at, c.resolved_at
        from review_comments c
        left join lines l on l.id = c.line_id
        where c.book_id = ${bookId} and c.family_id = ${actor.familyId}
            and (${ownVoice}::text is null or l.member_id = ${ownVoice}::text)
        order by c.created_at
    `
})
