import { getDb } from '../../utils/db'
import { isValidBudget } from '../../utils/ai/jobs'
import { actorEntry, record } from '../../utils/journal'
import { requirePermission } from '../../utils/permissions'
import { badRequest } from '../../utils/validate'

export default defineEventHandler(async (event): Promise<{ ok: boolean }> => {
    const actor = await requirePermission(event, 'ai.use')
    const body = await readBody<Partial<IAiBudgetBody>>(event)
    const budget = body.monthlyBudgetUsd
    if (budget !== null && !isValidBudget(budget)) {
        return badRequest('Invalid budget')
    }
    await getDb()`update families set ai_monthly_budget_usd = ${budget ?? null} where id = ${actor.familyId}`
    await record(event, { ...actorEntry(actor), action: 'ai.budget.updated', entityType: 'family', entityId: actor.familyId, after: { monthlyBudgetUsd: budget ?? null } })
    return { ok: true }
})
