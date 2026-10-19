import { verifyAccountPassword } from '~~/technical/Auth/server/utils/account-password'
import { supabaseAdmin, supabaseEnabled } from '~~/technical/Auth/server/utils/supabase'
import { getDb } from '~~/server/utils/db'
import { requireSession } from '~~/server/utils/family'
import { logEvent } from '~~/server/utils/log'
import { hashPassword } from '~~/technical/Auth/server/utils/password'
import { requireActor } from '~~/technical/Auth/server/utils/profile-code'
import { startSession } from '~~/technical/Auth/server/utils/session'
import { assertNotThrottled, clearFailures, recordFailure } from '~~/technical/Auth/server/utils/throttle'
import { badRequest } from '~~/server/utils/validate'

const MIN_PASSWORD_LENGTH = 8
const MAX_PASSWORD_LENGTH = 200

export default defineEventHandler(async (event): Promise<{ ok: true }> => {
    const session = requireSession(event)
    const actor = await requireActor(event)
    if (actor.role !== 'parent') {
        throw createError({ statusCode: 403, statusMessage: 'Only a parent can change the password' })
    }
    const body = await readBody<Partial<IPasswordChangeInput>>(event)
    const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : ''
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword : ''
    if (newPassword.length < MIN_PASSWORD_LENGTH || newPassword.length > MAX_PASSWORD_LENGTH) {
        return badRequest('Invalid password')
    }
    if (newPassword === currentPassword) {
        return badRequest('The new password must be different')
    }
    const db = getDb()
    const [account] = await db<{ email: string; passwordHash: string }[]>`
        select lower(email) as email, password_hash from accounts where id = ${session.accountId}
    `
    if (!account) {
        throw createError({ statusCode: 401, statusMessage: 'Not signed in' })
    }
    await assertNotThrottled(event, account.email)
    if (!(await verifyAccountPassword(session.accountId, account.email, currentPassword, account.passwordHash))) {
        await recordFailure(event, account.email)
        throw createError({ statusCode: 403, statusMessage: 'Wrong current password' })
    }
    await clearFailures(account.email)
    const changedAt = new Date()
    if (supabaseEnabled()) {
        const [identity] = await db<{ supabaseUserId: string }[]>`select supabase_user_id from accounts where id = ${session.accountId}`
        if (!identity?.supabaseUserId) {
            throw createError({ statusCode: 503, statusMessage: 'Account identity is unavailable' })
        }
        await db`update accounts set password_changed_at = ${changedAt} where id = ${session.accountId}`
        const { error } = await supabaseAdmin().auth.admin.updateUserById(identity.supabaseUserId, { password: newPassword })
        if (error) {
            throw createError({ statusCode: 503, statusMessage: 'Password could not be changed' })
        }
    }
    const passwordHash = await hashPassword(newPassword)
    await db`
        update accounts set password_hash = ${passwordHash}, password_changed_at = ${changedAt}
        where id = ${session.accountId}
    `
    startSession(event, { ...session, issuedAt: changedAt.getTime() })
    logEvent('Mot de passe du compte changé')
    return { ok: true }
})
