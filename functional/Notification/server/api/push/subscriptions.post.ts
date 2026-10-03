import { getDb } from '~~/server/utils/db'
import { loadActor, requireActorMember } from '~~/technical/Auth/server/utils/permissions'
import { badRequest, isNonEmptyString } from '~~/server/utils/validate'

const PLATFORMS: PushPlatform[] = ['WEB', 'IOS', 'ANDROID']
const MAX_ENDPOINT_LENGTH = 2048
const MAX_AGENT_LENGTH = 200

export default defineEventHandler(async (event): Promise<{ ok: boolean }> => {
    const actor = await loadActor(event)
    const memberId = requireActorMember(actor)
    const body = await readBody<Partial<IPushSubscriptionInput>>(event)
    if (!PLATFORMS.includes(body.platform as PushPlatform) || !isNonEmptyString(body.endpoint) || body.endpoint.length > MAX_ENDPOINT_LENGTH) {
        return badRequest('Invalid subscription')
    }
    if (body.platform === 'WEB' && !/^https:\/\//.test(body.endpoint)) {
        return badRequest('A web push endpoint must use https')
    }
    const keys = body.keys && typeof body.keys === 'object' ? body.keys : {}
    const userAgent = (getRequestHeader(event, 'user-agent') ?? '').slice(0, MAX_AGENT_LENGTH)
    const db = getDb()
    await db`
        insert into push_subscriptions (family_id, account_id, member_id, platform, endpoint, keys, user_agent)
        values (${actor.familyId}, ${actor.accountId}, ${memberId}, ${body.platform as PushPlatform}, ${body.endpoint}, ${db.json(keys)}, ${userAgent})
        on conflict (endpoint) do update
        set family_id = excluded.family_id, account_id = excluded.account_id, member_id = excluded.member_id, platform = excluded.platform,
            keys = excluded.keys, user_agent = excluded.user_agent, revoked_at = null
    `
    return { ok: true }
})
