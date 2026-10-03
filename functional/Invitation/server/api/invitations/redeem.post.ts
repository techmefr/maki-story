import { getDb, one } from '~~/server/utils/db'
import { findInvitation } from '~~/server/utils/invitations'
import { normalizeInviteCode } from '~~/server/utils/inviteCode'
import { logEvent } from '~~/server/utils/log'
import { DUMMY_HASH, hashPassword, verifyPassword } from '~~/technical/Auth/server/utils/password'
import { isSessionCurrent, readSession, startSession } from '~~/technical/Auth/server/utils/session'
import { assertIpBudget, assertNotThrottled, clearFailures, recordFailure, recordIpHit } from '~~/technical/Auth/server/utils/throttle'
import { badRequest, isNonEmptyString, normalizeEmail } from '~~/server/utils/validate'

const REDEEMS_PER_WINDOW = 30
const MIN_PASSWORD_LENGTH = 8
const MAX_PASSWORD_LENGTH = 200
const MAX_NAME_LENGTH = 60
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const DEFAULT_RELATIVE_COLOR: VoiceColorId = 'grape'

const invalidCode = (): never => {
    throw createError({ statusCode: 410, statusMessage: 'This invitation is invalid or expired' })
}

const resolveAccount = async (event: Parameters<typeof readSession>[0], body: Partial<IInvitationRedeem>): Promise<{ accountId: string; isNew: boolean; email: string }> => {
    const db = getDb()
    const session = readSession(event)
    if (session && (await isSessionCurrent(session))) {
        const [account] = await db<{ email: string }[]>`select email from accounts where id = ${session.accountId}`
        if (account) {
            return { accountId: session.accountId, isNew: false, email: account.email }
        }
    }
    const email = normalizeEmail(body.email)
    const password = typeof body.password === 'string' ? body.password : ''
    if (!EMAIL_PATTERN.test(email) || password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
        return badRequest('An e-mail and a password are required')
    }
    const [existing] = await db<{ id: string; passwordHash: string }[]>`select id, password_hash from accounts where lower(email) = ${email}`
    if (existing) {
        await assertNotThrottled(event, email)
        if (!(await verifyPassword(password, existing.passwordHash))) {
            await recordFailure(event, email)
            throw createError({ statusCode: 401, statusMessage: 'Wrong email or password' })
        }
        await clearFailures(email)
        return { accountId: existing.id, isNew: false, email }
    }
    await verifyPassword(password, DUMMY_HASH)
    const hash = await hashPassword(password)
    const created = one(await db<{ id: string }[]>`insert into accounts (email, password_hash) values (${email}, ${hash}) returning id`)
    return { accountId: created.id, isNew: true, email }
}

export default defineEventHandler(async (event): Promise<IAuthState> => {
    await assertIpBudget(event, 'invite-redeem', REDEEMS_PER_WINDOW)
    await recordIpHit(event, 'invite-redeem')
    const body = await readBody<Partial<IInvitationRedeem>>(event)
    const code = normalizeInviteCode(body.code)
    const db = getDb()
    const invitation = await findInvitation(db, code)
    if (!invitation || !invitation.isUsable) {
        return invalidCode()
    }
    const account = await resolveAccount(event, body)
    const memberId = await db.begin(async tx => {
        const claimed = await tx<{ id: string }[]>`
            update invitations set used_at = now(), used_by_account_id = ${account.accountId}
            where id = ${invitation.id} and used_at is null and revoked_at is null and expires_at > now() returning id
        `
        if (claimed.length === 0) {
            return invalidCode()
        }
        const [existing] = await tx<{ status: string }[]>`
            select status from memberships where account_id = ${account.accountId} and family_id = ${invitation.familyId}
        `
        const [parentLink] = await tx`select 1 from account_families where account_id = ${account.accountId} and family_id = ${invitation.familyId}`
        if (existing || parentLink) {
            throw createError({ statusCode: 409, statusMessage: 'You already belong to this family' })
        }
        let profileId = invitation.memberId
        if (profileId !== null) {
            const [free] = await tx<{ id: string }[]>`
                select id from members where id = ${profileId} and family_id = ${invitation.familyId} and role = 'relative' and deleted_at is null and status = 'active'
            `
            profileId = free?.id ?? null
        }
        if (profileId === null) {
            const fallbackName = account.email.split('@')[0] ?? ''
            const name = [body.name, invitation.name, fallbackName].find(isNonEmptyString)?.trim().slice(0, MAX_NAME_LENGTH) ?? fallbackName
            profileId = one(await tx<{ id: string }[]>`
                insert into members (family_id, name, role, color) values (${invitation.familyId}, ${name}, 'relative', ${DEFAULT_RELATIVE_COLOR}) returning id
            `).id
        }
        await tx`
            insert into memberships (account_id, family_id, member_id, role, status, child_ids)
            values (${account.accountId}, ${invitation.familyId}, ${profileId}, 'relative', 'ACTIVE', ${invitation.childIds})
        `
        return profileId
    })
    startSession(event, { accountId: account.accountId, familyId: invitation.familyId, memberId })
    logEvent(account.isNew ? 'Invitation utilisée : nouveau compte' : 'Invitation utilisée : compte existant')
    return { isSignedIn: true, memberId, isRelativeAccount: true }
})
