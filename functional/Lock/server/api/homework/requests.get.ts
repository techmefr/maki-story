import { getDb } from '~~/server/utils/db'
import { listPendingHomework } from '~~/server/utils/homework'
import { requirePermission } from '~~/technical/Auth/server/utils/permissions'

export default defineEventHandler(async (event): Promise<IHomeworkRequestList> => {
    const actor = await requirePermission(event, 'members.schedule.manage')
    return { items: await listPendingHomework(getDb(), actor.familyId) }
})
