import { getDb } from '~~/server/utils/db'
import { actorEntry, record } from '~~/server/utils/journal'
import { logEvent } from '~~/server/utils/log'
import { requirePermission } from '~~/technical/Auth/server/utils/permissions'
import { loadShareRow } from '~~/server/utils/shares'
import { notFound, requireParam } from '~~/server/utils/validate'

export default defineEventHandler(async (event): Promise<{ ok: boolean }> => {
    const actor = await requirePermission(event, 'shares.review')
    const db = getDb()
    const share = await loadShareRow(db, requireParam(event, 'id'))
    const isParty = share.ownerFamilyId === actor.familyId || share.targetFamilyId === actor.familyId
    if (!isParty || ['declined', 'revoked'].includes(share.status)) {
        return notFound('Share not found')
    }
    await db`update book_shares set status = ${'revoked'}, updated_at = now() where id = ${share.id}`
    await record(event, { ...actorEntry(actor), action: 'share.stopped', entityType: 'share', entityId: share.id })
    logEvent('Partage arrêté')
    return { ok: true }
})
