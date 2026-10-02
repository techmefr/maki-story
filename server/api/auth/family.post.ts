import { getDb } from '../../utils/db'
import { requireSession } from '../../utils/family'
import { isFamilyParentAccount, relativeMemberFor } from '../../utils/memberships'
import { startSession } from '../../utils/session'
import { isNonEmptyString } from '../../utils/validate'

export default defineEventHandler(async (event): Promise<IAuthState> => {
    const session = requireSession(event)
    const body = await readBody<{ familyId?: string }>(event)
    if (!isNonEmptyString(body.familyId)) {
        throw createError({ statusCode: 400, statusMessage: 'Missing family' })
    }
    const db = getDb()
    const isParent = await isFamilyParentAccount(db, session.accountId, body.familyId)
    const memberId = isParent ? null : await relativeMemberFor(db, session.accountId, body.familyId)
    if (!isParent && memberId === null) {
        throw createError({ statusCode: 403, statusMessage: 'You are not part of this family' })
    }
    startSession(event, { accountId: session.accountId, familyId: body.familyId, memberId })
    return { isSignedIn: true, memberId, isRelativeAccount: !isParent }
})
