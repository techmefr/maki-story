import { ensureSchema, getDb } from '~~/server/utils/db'
import { isFamilyParentAccount } from '~~/server/utils/memberships'
import { isSessionCurrent, readSession } from '~~/server/utils/session'

export default defineEventHandler(async (event): Promise<IAuthState> => {
    const session = readSession(event)
    if (!session) {
        return { isSignedIn: false, memberId: null }
    }
    await ensureSchema()
    if (!(await isSessionCurrent(session))) {
        return { isSignedIn: false, memberId: null }
    }
    const isRelativeAccount = !(await isFamilyParentAccount(getDb(), session.accountId, session.familyId))
    return { isSignedIn: true, memberId: session.memberId, isRelativeAccount }
})
