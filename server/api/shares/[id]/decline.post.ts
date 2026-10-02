import { getDb } from '../../../utils/db'
import { actorEntry, record } from '../../../utils/journal'
import { logEvent } from '../../../utils/log'
import { requirePermission } from '../../../utils/permissions'
import { bookTitle, familyName, loadShareRow, notifyParents } from '../../../utils/shares'
import { notFound, requireParam } from '../../../utils/validate'

export default defineEventHandler(async (event): Promise<{ status: ShareStatus }> => {
    const actor = await requirePermission(event, 'shares.review')
    const db = getDb()
    const share = await loadShareRow(db, requireParam(event, 'id'))
    const isTarget = share.targetFamilyId === actor.familyId && share.status === 'pending'
    const isApprover = share.approverFamilyId === actor.familyId && ['proposed', 'awaiting_owner'].includes(share.status)
    if (!isTarget && !isApprover) {
        return notFound('Share not found')
    }
    await db`update book_shares set status = ${'declined'}, updated_at = now() where id = ${share.id}`
    if (isTarget) {
        await notifyParents(db, share.ownerFamilyId, 'share_declined', {
            familyName: await familyName(db, share.targetFamilyId),
            bookTitle: await bookTitle(db, share.bookId),
            mode: share.mode,
        })
    }
    await record(event, { ...actorEntry(actor), action: 'share.declined', entityType: 'share', entityId: share.id })
    logEvent('Partage refusé')
    return { status: 'declined' }
})
