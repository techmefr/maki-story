import { getDb } from '../../utils/db'
import { actorEntry, record } from '../../utils/journal'
import { requirePermission } from '../../utils/permissions'
import { restoreTrashItem } from '../../utils/trash'
import { badRequest, isNonEmptyString } from '../../utils/validate'

const TYPES: TrashItemType[] = ['book', 'member', 'message', 'treasure', 'recordings']

export default defineEventHandler(async (event): Promise<{ ok: boolean }> => {
    const actor = await requirePermission(event, 'family.trash')
    const body = await readBody<Partial<ITrashRestoreBody>>(event)
    if (!body.type || !TYPES.includes(body.type) || !isNonEmptyString(body.id)) {
        return badRequest('Invalid item')
    }
    await restoreTrashItem(getDb(), actor.familyId, body.type, body.id)
    await record(event, { ...actorEntry(actor), action: `${body.type}.restored`, entityType: body.type, entityId: body.id })
    return { ok: true }
})
