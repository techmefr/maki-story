import { DEMO_FAMILY, demoProfile } from '~~/shared/utils/demo'
import { getDb } from '~~/server/utils/db'
import { startSession } from '~~/technical/Auth/server/utils/session'
import { assertLocalDemo } from '../../utils/demo'

export default defineEventHandler(async event => {
    assertLocalDemo(event)
    const body = await readBody<{ id?: unknown }>(event)
    const profile = demoProfile(body?.id)
    if (!profile) throw createError({ statusCode: 403, statusMessage: 'Unknown demo profile' })
    const [row] = await getDb()<{ id: string }[]>`
        select m.id from members m
        join memberships ms on ms.family_id = m.family_id and ms.account_id = ${profile.accountId}
        join accounts a on a.id = ms.account_id
        join families f on f.id = m.family_id
        where m.id = ${profile.id} and m.family_id = ${DEMO_FAMILY} and a.email = ${profile.email}
        and ms.status = 'ACTIVE' and m.role = ${profile.role} and m.status = 'active' and m.deleted_at is null and f.deleted_at is null
        and (ms.role = 'parent' or ms.member_id = m.id)
    `
    if (!row) throw createError({ statusCode: 404, statusMessage: 'Run the demo seeder first' })
    startSession(event, { accountId: profile.accountId, familyId: DEMO_FAMILY, memberId: profile.id, memberSince: Date.now() })
    return { path: profile.path }
})
