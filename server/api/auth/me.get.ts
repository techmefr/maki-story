import { ensureSchema, getDb } from '../../utils/db'
import { isFamilyParentAccount } from '../../utils/memberships'
import { isSessionCurrent, readSession } from '../../utils/session'

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
