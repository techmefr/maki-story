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

export default defineEventHandler(async (event): Promise<IAuthState> => {
    const body = await readBody<Partial<ILoginInput>>(event)
    const email = normalizeEmail(body.email)
    const password = typeof body.password === 'string' ? body.password : ''
    await assertNotThrottled(event, email)
    const db = getDb()
    const [account] = await db<IAccountRow[]>`select id, password_hash from accounts where lower(email) = ${email}`
    const isValid = await verifyPassword(password, account?.passwordHash ?? DUMMY_HASH)
    const [link] = account
        ? await db<{ familyId: string }[]>`
            select af.family_id from account_families af join families f on f.id = af.family_id
            where af.account_id = ${account.id} and f.deleted_at is null order by af.created_at limit 1
        `
        : []
    if (!account || !link || !isValid) {
        await recordFailure(event, email)
        logEvent('Connexion refusée : e-mail ou mot de passe incorrect')
        await new Promise(resolve => setTimeout(resolve, FAILED_LOGIN_DELAY_MS))
        throw createError({ statusCode: 401, statusMessage: 'Wrong email or password' })
    }
    await clearFailures(email)
    startSession(event, { accountId: account.id, familyId: link.familyId, memberId: null })
    logEvent('Connexion réussie')
    return { isSignedIn: true, memberId: null }
})
