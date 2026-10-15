import { getDb } from '~~/server/utils/db'
import { loadControlsOrDefault } from '~~/server/utils/accessControl'
import { requirePermission } from '~~/technical/Auth/server/utils/permissions'
import { requireParam } from '~~/server/utils/validate'

export default defineEventHandler(async (event): Promise<IAccessControls> => {
    const actor = await requirePermission(event, 'members.schedule.manage')
    return loadControlsOrDefault(getDb(), actor.familyId, requireParam(event, 'id'))
})
