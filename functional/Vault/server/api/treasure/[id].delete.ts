import { getDb } from '~~/server/utils/db'
import { actorEntry, record } from '~~/server/utils/journal'
import { requirePermission } from '~~/technical/Auth/server/utils/permissions'
import { notFound, requireParam } from '~~/server/utils/validate'

export default defineEventHandler(async (event): Promise<{ ok: boolean }> => {
    const actor = await requirePermission(event, 'treasure.remove')
    const id = requireParam(event, 'id')
    const removed = await getDb().begin(async tx => {
        const [row] = await tx<{ fileId: string; childId: string; sourceMessageId: string | null }[]>`
            delete from treasures where id = ${id} and family_id = ${actor.familyId} and (child_id = ${actor.memberId} or (${actor.role === 'parent'} and exists (select 1 from members owner where owner.id = treasures.child_id and owner.role = 'child'))) returning file_id, child_id, source_message_id
        `
        if (row) {
            if (row.sourceMessageId) {
                await tx`update messages set status = 'DELETED', deleted_at = now() where id = ${row.sourceMessageId} and family_id = ${actor.familyId}`
            }
            await tx`delete from files where id = ${row.fileId} and family_id = ${actor.familyId}`
        }
        return row ?? null
    })
    if (!removed) {
        return notFound('Memory not found')
    }
    await record(event, { ...actorEntry(actor), action: 'treasure.removed', entityType: 'treasure', entityId: id, targetMemberId: removed.childId })
    return { ok: true }
})
