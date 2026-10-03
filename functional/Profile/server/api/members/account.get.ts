import { getDb } from '~~/server/utils/db'
import { requireSession } from '~~/server/utils/family'
import { requireActor } from '~~/technical/Auth/server/utils/profile-code'

export default defineEventHandler(async (event): Promise<IProfileAccount> => {
    const actor = await requireActor(event)
    if (actor.role === 'child') {
        throw createError({ statusCode: 403, statusMessage: 'A child has no account details' })
    }
    const session = requireSession(event)
    const db = getDb()
    const [account] = await db<{ email: string }[]>`select email from accounts where id = ${session.accountId}`
    const [identity] = await db<{ provider: string }[]>`
        select provider from account_identities where account_id = ${session.accountId} and provider = 'google' limit 1
    `
    return { email: account?.email ?? '', hasGoogle: identity !== undefined }
})
