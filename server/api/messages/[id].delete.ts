import { getDb } from '../../utils/db'
import { actorEntry, record } from '../../utils/journal'
import { requirePermission } from '../../utils/permissions'
import { notFound, requireParam } from '../../utils/validate'

export default defineEventHandler(async (event): Promise<{ ok: boolean }> => {
    const actor = await requirePermission(event, 'messages.delete')
    const id = requireParam(event, 'id')
    const deleted = await getDb()`
        update messages set status = 'DELETED', deleted_at = now()
        where id = ${id} and family_id = ${actor.familyId} and deleted_at is null
        returning id
    `
    if (deleted.length === 0) {
        return notFound('Message not found')
    }
    await record(event, { ...actorEntry(actor), action: 'message.deleted', entityType: 'message', entityId: id })
    return { ok: true }
})
