import { getDb } from '~~/server/utils/db'
import { isToggleableProvider, readFamilyProviders } from '~~/server/utils/allowedProviders'
import { requirePermission } from '~~/technical/Auth/server/utils/permissions'
import { badRequest } from '~~/server/utils/validate'

export default defineEventHandler(async (event): Promise<Record<ToggleableProviderId, boolean>> => {
    const { familyId } = await requirePermission(event, 'members.manage')
    const body = await readBody<{ provider?: unknown; isEnabled?: unknown }>(event)
    if (!isToggleableProvider(body.provider) || typeof body.isEnabled !== 'boolean') {
        return badRequest('Invalid provider')
    }
    const db = getDb()
    await db`
        insert into allowed_providers (family_id, provider, is_enabled) values (${familyId}, ${body.provider}, ${body.isEnabled})
        on conflict (family_id, provider) do update set is_enabled = excluded.is_enabled, updated_at = now()
    `
    return readFamilyProviders(db, familyId)
})
