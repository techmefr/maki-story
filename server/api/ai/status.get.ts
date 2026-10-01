import { getDb } from '../../utils/db'
import { requirePermission } from '../../utils/permissions'
import { monthlyBudgetUsd, monthlySpentUsd } from '../../utils/ai/jobs'
import { resolveProvider } from '../../utils/ai/provider'

export default defineEventHandler(async (event): Promise<IAiStatus> => {
    const { familyId } = await requirePermission(event, 'ai.use')
    const budget = monthlyBudgetUsd()
    const spent = await monthlySpentUsd(getDb(), familyId)
    return { enabled: resolveProvider() !== null, monthlyBudgetUsd: budget, spentUsd: spent, remainingUsd: Math.max(budget - spent, 0) }
})
