import { getDb } from '~~/server/utils/db'
import { readFamilyProviders } from '~~/server/utils/allowedProviders'
import { requirePermission } from '~~/technical/Auth/server/utils/permissions'

export default defineEventHandler(async (event): Promise<Record<ToggleableProviderId, boolean>> => {
    const { familyId } = await requirePermission(event, 'members.manage')
    return readFamilyProviders(getDb(), familyId)
})
