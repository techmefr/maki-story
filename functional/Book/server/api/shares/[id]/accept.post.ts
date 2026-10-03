import { getDb } from '~~/server/utils/db'
import { actorEntry, record } from '~~/server/utils/journal'
import { logEvent } from '~~/server/utils/log'
import { requirePermission } from '~~/server/utils/permissions'
import { bookTitle, copyBookToFamily, familyName, loadShareRow, notifyParents } from '~~/server/utils/shares'
import { badRequest, notFound, requireParam } from '~~/server/utils/validate'

interface IAcceptBody {
    recorderMemberId?: string | null
}

export default defineEventHandler(async (event): Promise<{ status: ShareStatus; copiedBookId: string | null }> => {
    const actor = await requirePermission(event, 'shares.review')
    const db = getDb()
    const share = await loadShareRow(db, requireParam(event, 'id'))
    if (share.targetFamilyId !== actor.familyId || share.status !== 'pending') {
        return notFound('Share not found')
    }
    const body = (await readBody<IAcceptBody>(event)) ?? {}
    let recorderId: string | null = null
    if (share.mode === 'record' && typeof body.recorderMemberId === 'string') {
        const [recorder] = await db<{ id: string }[]>`
            select id from members
            where id = ${body.recorderMemberId} and family_id = ${actor.familyId} and deleted_at is null
                and status = ${'active'} and source_member_id is null and role in (${'parent'}, ${'relative'})
        `
        if (!recorder) {
            return badRequest('Choose an adult of your family')
        }
        recorderId = recorder.id
    }
    const copiedBookId = await db.begin(async tx => {
        const copied = share.mode === 'copy' ? await copyBookToFamily(tx, share.bookId, share.ownerFamilyId, share.targetFamilyId) : null
        await tx`
            update book_shares set status = ${'accepted'}, recorder_member_id = ${recorderId}, copied_book_id = ${copied}, updated_at = now()
            where id = ${share.id}
        `
        return copied
    })
    await notifyParents(db, share.ownerFamilyId, 'share_accepted', {
        familyName: await familyName(db, share.targetFamilyId),
        bookTitle: await bookTitle(db, share.bookId),
        mode: share.mode,
    })
    await record(event, { ...actorEntry(actor), action: 'share.accepted', entityType: 'share', entityId: share.id })
    logEvent('Partage accepté')
    return { status: 'accepted', copiedBookId }
})
