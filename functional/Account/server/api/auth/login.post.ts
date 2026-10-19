import { verifyAccountPassword } from '~~/technical/Auth/server/utils/account-password'
import { getDb } from '~~/server/utils/db'
import { logEvent } from '~~/server/utils/log'
import { DUMMY_HASH } from '~~/technical/Auth/server/utils/password'
import { startSession } from '~~/technical/Auth/server/utils/session'
import { assertNotThrottled, clearFailures, recordFailure } from '~~/technical/Auth/server/utils/throttle'
import { normalizeEmail } from '~~/server/utils/validate'
import { resolveAccountLink } from '../../utils/accountLink'

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
    const isValid = await verifyAccountPassword(account?.id ?? null, email, password, account?.passwordHash ?? DUMMY_HASH)
    const link = account ? await resolveAccountLink(db, account.id) : null
    if (!account || !link || !isValid) {
        await recordFailure(event, email)
        logEvent('Connexion refusée : e-mail ou mot de passe incorrect')
        await new Promise(resolve => setTimeout(resolve, FAILED_LOGIN_DELAY_MS))
        throw createError({ statusCode: 401, statusMessage: 'Wrong email or password' })
    }
    await clearFailures(email)
    startSession(event, { accountId: account.id, familyId: link.familyId, memberId: link.memberId })
    logEvent('Connexion réussie')
    return { isSignedIn: true, memberId: link.memberId, isRelativeAccount: link.isRelativeAccount }
})
