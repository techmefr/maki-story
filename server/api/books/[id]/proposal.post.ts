import { getDb } from '../../../utils/db'
import { actorEntry, record } from '../../../utils/journal'
import { notify } from '../../../utils/notifications'
import { requirePermission } from '../../../utils/permissions'
import { badRequest, notFound, requireParam } from '../../../utils/validate'

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
        await db`update books set status = 'to_record' where id = ${id} and family_id = ${familyId}`
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
