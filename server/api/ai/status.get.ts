import { getDb } from '../../utils/db'
import { requirePermission } from '../../utils/permissions'
import { familyBudgetUsd, monthlySpentUsd, defaultBudgetUsd } from '../../utils/ai/jobs'
import { resolveProvider } from '../../utils/ai/provider'

export default defineEventHandler(async (event): Promise<IAiStatus> => {
    const { familyId } = await requirePermission(event, 'ai.use')
    const db = getDb()
    const { budgetUsd, isCustom } = await familyBudgetUsd(db, familyId)
    const spent = await monthlySpentUsd(db, familyId)
    return {
        enabled: resolveProvider() !== null,
        monthlyBudgetUsd: budgetUsd,
        defaultBudgetUsd: defaultBudgetUsd(),
        isCustomBudget: isCustom,
        spentUsd: spent,
        remainingUsd: Math.max(budgetUsd - spent, 0),
    }
})
