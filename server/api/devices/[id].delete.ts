import { getDb } from '../../utils/db'
import { requireActor } from '~~/technical/Auth/server/utils/profile-code'
import { notFound, requireParam } from '../../utils/validate'

export default defineEventHandler(async (event): Promise<{ ok: true }> => {
    const actor = await requireActor(event)
    const id = requireParam(event, 'id')
    const revoked = await getDb()<{ id: string }[]>`
        update member_devices set revoked_at = now()
        where id = ${id} and family_id = ${actor.familyId} and revoked_at is null
            and (${actor.role === 'parent'} or member_id = ${actor.id})
        returning id
    `
    if (revoked.length === 0) {
        return notFound('Device not found')
    }
    return { ok: true }
})
