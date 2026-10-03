import { getDb } from '~~/server/utils/db'
import { actorEntry, record } from '~~/server/utils/journal'
import { requirePermission } from '~~/server/utils/permissions'
import { notFound, requireParam } from '~~/server/utils/validate'

export default defineEventHandler(async (event): Promise<{ ok: boolean }> => {
    const actor = await requirePermission(event, 'treasure.remove')
    const id = requireParam(event, 'id')
    const removed = await getDb().begin(async tx => {
        const [row] = await tx<{ fileId: string; childId: string }[]>`
            delete from treasures where id = ${id} and family_id = ${actor.familyId} returning file_id, child_id
        `
        if (row) {
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
