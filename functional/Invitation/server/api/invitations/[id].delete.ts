import { getDb } from '~~/server/utils/db'
import { requirePermission } from '~~/technical/Auth/server/utils/permissions'
import { notFound, requireParam } from '~~/server/utils/validate'

export default defineEventHandler(async (event): Promise<{ ok: boolean }> => {
    const { familyId } = await requirePermission(event, 'family.invite')
    const id = requireParam(event, 'id')
    const revoked = await getDb()`
        update invitations set revoked_at = now() where id = ${id} and family_id = ${familyId} and used_at is null and revoked_at is null returning id
    `
    return revoked.length > 0 ? { ok: true } : notFound('Invitation not found')
})
