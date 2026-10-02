import { getDb } from '../../utils/db'
import { requirePermission } from '../../utils/permissions'
import { listTrash } from '../../utils/trash'

export default defineEventHandler(async (event): Promise<ITrashItem[]> => {
    const actor = await requirePermission(event, 'family.trash')
    return listTrash(getDb(), actor.familyId)
})
