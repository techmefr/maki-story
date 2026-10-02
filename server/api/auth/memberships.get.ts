import { getDb } from '../../utils/db'
import { requireSession } from '../../utils/family'
import { isFamilyParentAccount, listMemberships } from '../../utils/memberships'

export default defineEventHandler(async (event): Promise<IAccountOverview> => {
    const session = requireSession(event)
    const db = getDb()
    return {
        isRelativeAccount: !(await isFamilyParentAccount(db, session.accountId, session.familyId)),
        memberships: await listMemberships(db, session.accountId),
    }
})
