import { getDb } from '~~/server/utils/db'
import { logEvent } from '~~/server/utils/log'
import { badRequest, isNonEmptyString } from '~~/server/utils/validate'
import { startSession } from '~~/technical/Auth/server/utils/session'
import { assertIpBudget, recordIpHit } from '~~/technical/Auth/server/utils/throttle'
import { resolveAccountLink } from '../../../utils/accountLink'
import { resetAdultCodes } from '../../../utils/codeReset'
import { hashMagicToken } from '../../../utils/magicLink'

const IP_BUDGET = 20

export default defineEventHandler(async (event): Promise<IAuthState> => {
    const body = await readBody<{ token?: string }>(event)
    if (!isNonEmptyString(body.token)) {
        return badRequest('Invalid link')
    }
    await assertIpBudget(event, 'magic-verify', IP_BUDGET)
    await recordIpHit(event, 'magic-verify')
    const db = getDb()
    const tokenHash = hashMagicToken(body.token)
    const [used] = await db<{ accountId: string; purpose: string }[]>`
        update magic_links set used_at = now()
        where token_hash = ${tokenHash} and used_at is null and expires_at > now()
        returning account_id, purpose
    `
    if (!used) {
        const [known] = await db<{ usedAt: string | null }[]>`select used_at from magic_links where token_hash = ${tokenHash}`
        throw createError({ statusCode: 410, statusMessage: known?.usedAt ? 'This link was already used' : 'This link has expired' })
    }
    const link = await resolveAccountLink(db, used.accountId)
    if (!link) {
        throw createError({ statusCode: 410, statusMessage: 'This link has expired' })
    }
    if (used.purpose === 'code_reset') {
        await resetAdultCodes(db, used.accountId)
        logEvent('Codes adultes réinitialisés')
    }
    startSession(event, { accountId: used.accountId, familyId: link.familyId, memberId: link.memberId })
    logEvent('Connexion par lien magique')
    return { isSignedIn: true, memberId: link.memberId, isRelativeAccount: link.isRelativeAccount }
})
