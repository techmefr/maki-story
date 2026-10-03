import { getDb } from '~~/server/utils/db'
import { logEvent } from '~~/server/utils/log'
import { requirePermission } from '~~/server/utils/permissions'

export default defineEventHandler(async (event): Promise<{ ok: boolean }> => {
    const { familyId } = await requirePermission(event, 'family.invite')
    await getDb()`update families set invite_revoked_at = coalesce(invite_revoked_at, now()) where id = ${familyId}`
    logEvent('Code d’invitation révoqué')
    return { ok: true }
})
