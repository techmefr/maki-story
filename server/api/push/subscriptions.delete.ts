import { getDb } from '../../utils/db'
import { loadActor, requireActorMember } from '../../utils/permissions'
import { badRequest, isNonEmptyString } from '../../utils/validate'

export default defineEventHandler(async (event): Promise<{ ok: boolean }> => {
    const actor = await loadActor(event)
    const memberId = requireActorMember(actor)
    const body = await readBody<{ endpoint?: string }>(event)
    if (!isNonEmptyString(body.endpoint)) {
        return badRequest('Missing endpoint')
    }
    await getDb()`
        update push_subscriptions set revoked_at = now()
        where endpoint = ${body.endpoint} and family_id = ${actor.familyId} and member_id = ${memberId} and revoked_at is null
    `
    return { ok: true }
})
