import { getDb } from '~~/server/utils/db'
import { actorEntry, record } from '~~/server/utils/journal'
import { notFound, requireParam } from '~~/server/utils/validate'
import { requireRole } from '~~/technical/Auth/server/utils/permissions'

export default defineEventHandler(async (event): Promise<{ ok: true }> => {
    const actor = await requireRole(event, 'parent')
    const slug = requireParam(event, 'slug')
    const removed = await getDb()`delete from tags where family_id = ${actor.familyId} and slug = ${slug} returning id`
    if (removed.length === 0) {
        return notFound('Tag not found')
    }
    await record(event, { ...actorEntry(actor), action: 'tag.deleted', entityType: 'tag', entityId: slug })
    return { ok: true }
})
