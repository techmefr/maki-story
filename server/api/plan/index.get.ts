import { getDb } from '~~/server/utils/db'
import { loadPlanUsage } from '~~/server/utils/plan'
import { requirePermission } from '~~/technical/Auth/server/utils/permissions'

export default defineEventHandler(async (event): Promise<IPlanUsage> => {
    const actor = await requirePermission(event, 'books.list')
    return loadPlanUsage(getDb(), actor.familyId)
})
