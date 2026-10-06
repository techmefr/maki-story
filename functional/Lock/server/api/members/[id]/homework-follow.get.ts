import { getDb } from '~~/server/utils/db'
import { isHomeworkFollowed } from '~~/server/utils/homework'
import { requirePermission } from '~~/technical/Auth/server/utils/permissions'
import { requireParam } from '~~/server/utils/validate'

export default defineEventHandler(async (event): Promise<IHomeworkFollow> => {
    const actor = await requirePermission(event, 'members.schedule.manage')
    return { isEnabled: await isHomeworkFollowed(getDb(), actor.familyId, requireParam(event, 'id')) }
})
