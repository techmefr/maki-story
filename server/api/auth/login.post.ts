import { getDb } from '../../utils/db'
import { logEvent } from '../../utils/log'
import { DUMMY_HASH, verifyPassword } from '../../utils/password'
import { startSession } from '../../utils/session'
import { assertNotThrottled, clearFailures, recordFailure } from '../../utils/throttle'
import { normalizeEmail } from '../../utils/validate'

const FAILED_LOGIN_DELAY_MS = 600

interface IAccountRow {
    id: string
    passwordHash: string
}

interface ILinkRow {
    familyId: string
    memberId: string | null
}

export default defineEventHandler(async (event): Promise<IAuthState> => {
    const body = await readBody<Partial<ILoginInput>>(event)
    const email = normalizeEmail(body.email)
    const password = typeof body.password === 'string' ? body.password : ''
    await assertNotThrottled(event, email)
    const db = getDb()
    const [account] = await db<IAccountRow[]>`select id, password_hash from accounts where lower(email) = ${email}`
    const isValid = await verifyPassword(password, account?.passwordHash ?? DUMMY_HASH)
    const [parentLink] = account
        ? await db<ILinkRow[]>`
            select af.family_id, null::text as member_id from account_families af join families f on f.id = af.family_id
            where af.account_id = ${account.id} and f.deleted_at is null order by af.created_at limit 1
        `
        : []
    const [relativeLink] =
        account && !parentLink
            ? await db<ILinkRow[]>`
                select ms.family_id, ms.member_id from memberships ms
                join families f on f.id = ms.family_id and f.deleted_at is null
                join members m on m.id = ms.member_id and m.deleted_at is null and m.status = 'active'
                where ms.account_id = ${account.id} and ms.status = 'ACTIVE' and ms.role = 'relative'
                order by ms.created_at limit 1
            `
            : []
    const link = parentLink ?? relativeLink
    if (!account || !link || !isValid) {
        await recordFailure(event, email)
        logEvent('Connexion refusée : e-mail ou mot de passe incorrect')
        await new Promise(resolve => setTimeout(resolve, FAILED_LOGIN_DELAY_MS))
        throw createError({ statusCode: 401, statusMessage: 'Wrong email or password' })
    }
    await clearFailures(email)
    startSession(event, { accountId: account.id, familyId: link.familyId, memberId: link.memberId })
    logEvent('Connexion réussie')
    return { isSignedIn: true, memberId: link.memberId, isRelativeAccount: !parentLink }
})
