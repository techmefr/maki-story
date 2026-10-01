import { getDb } from '../../../utils/db'
import { logEvent } from '../../../utils/log'
import { notify } from '../../../utils/notifications'
import { requirePermission } from '../../../utils/permissions'
import { bookTitle, familyName, loadShareRow, memberName, notifyParents } from '../../../utils/shares'
import { notFound, requireParam } from '../../../utils/validate'

export default defineEventHandler(async (event): Promise<{ status: ShareStatus }> => {
    const actor = await requirePermission(event, 'shares.review')
    const db = getDb()
    const share = await loadShareRow(db, requireParam(event, 'id'))
    if (share.approverFamilyId !== actor.familyId || !['proposed', 'awaiting_owner'].includes(share.status)) {
        return notFound('Share not found')
    }
    const [book] = await db<{ originFamilyId: string | null }[]>`select origin_family_id from books where id = ${share.bookId}`
    const needsOwner = share.status === 'proposed' && book?.originFamilyId != null
    const status: ShareStatus = needsOwner ? 'awaiting_owner' : 'pending'
    const approverFamilyId = needsOwner ? book!.originFamilyId : null
    await db`update book_shares set status = ${status}, approver_family_id = ${approverFamilyId}, updated_at = now() where id = ${share.id}`
    const title = await bookTitle(db, share.bookId)
    const payload = { fromName: await memberName(db, actor.memberId), familyName: await familyName(db, share.ownerFamilyId), bookTitle: title, mode: share.mode }
    if (status === 'pending') {
        await notifyParents(db, share.targetFamilyId, 'share_received', payload)
        if (share.proposedByMemberId !== null) {
            await notify(db, { familyId: share.ownerFamilyId, recipientMemberId: share.proposedByMemberId, kind: 'share_approved', payload })
        }
    } else {
        await notifyParents(db, approverFamilyId!, 'share_to_approve', payload)
    }
    logEvent('Partage approuvé')
    return { status }
})
