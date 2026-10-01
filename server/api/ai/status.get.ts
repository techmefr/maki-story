import { getDb } from '../../utils/db'
import { requireSession } from '../../utils/family'
import { monthlyBudgetUsd, monthlySpentUsd } from '../../utils/ai/jobs'
import { resolveProvider } from '../../utils/ai/provider'

export default defineEventHandler(async (event): Promise<IAiStatus> => {
    const { familyId } = requireSession(event)
    const budget = monthlyBudgetUsd()
    const spent = await monthlySpentUsd(getDb(), familyId)
    return { enabled: resolveProvider() !== null, monthlyBudgetUsd: budget, spentUsd: spent, remainingUsd: Math.max(budget - spent, 0) }
})
