import { getDb } from '~~/server/utils/db'
import { actorEntry, record } from '~~/server/utils/journal'
import { notify } from '~~/server/utils/notifications'
import { approveBook, findReviewBook } from '~~/server/utils/review'
import { requireActorMember, requirePermission } from '~~/technical/Auth/server/utils/permissions'
import { badRequest, notFound, requireParam } from '~~/server/utils/validate'

const DECISIONS: ProposalDecision[] = ['approve', 'decline']

export default defineEventHandler(async (event): Promise<{ ok: boolean }> => {
    const actor = await requirePermission(event, 'books.review')
    const { familyId } = actor
    const id = requireParam(event, 'id')
    const body = await readBody<Partial<IProposalBody>>(event)
    if (!body.decision || !DECISIONS.includes(body.decision)) {
        return badRequest('Invalid decision')
    }
    const db = getDb()
    const [book] = await db<{ title: string; soloMemberId: string | null }[]>`
        select title, solo_member_id from books where id = ${id} and family_id = ${familyId} and deleted_at is null and status = 'proposed'
    `
    if (!book) {
        return notFound('Proposal not found')
    }
    if (body.decision === 'approve') {
        await db.begin(async tx => {
            await tx`update books set status = 'to_record' where id = ${id} and family_id = ${familyId}`
            const [state] = await tx<{ lines: number; missing: number }[]>`
                select count(*)::int as lines,
                    count(*) filter (where not exists (
                        select 1 from recordings r where r.line_id = l.id and r.status in ('draft', 'submitted', 'approved')
                    ))::int as missing
                from lines l where l.book_id = ${id} and l.family_id = ${familyId}
            `
            if (state && state.lines > 0 && state.missing === 0) {
                await approveBook(tx, familyId, await findReviewBook(tx, id, familyId), requireActorMember(actor))
            }
        })
    } else {
        await db`update books set deleted_at = now() where id = ${id} and family_id = ${familyId}`
    }
    await notify(db, {
        familyId,
        recipientMemberId: book.soloMemberId,
        kind: 'proposal_result',
        payload: { bookTitle: book.title, decision: body.decision },
    })
    await record(event, { ...actorEntry(actor), action: `book.proposal.${body.decision}`, entityType: 'book', entityId: id })
    return { ok: true }
})
