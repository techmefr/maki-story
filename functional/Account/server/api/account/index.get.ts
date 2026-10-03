import { getDb } from '~~/server/utils/db'
import { requireSession } from '~~/server/utils/family'
import { isFamilyParentAccount } from '~~/server/utils/memberships'
import { notFound } from '~~/server/utils/validate'

interface IAccountRow {
    email: string
    termsVersion: string | null
    termsAcceptedAt: string | null
}

export default defineEventHandler(async (event): Promise<IAccountInfo> => {
    const session = requireSession(event)
    const db = getDb()
    const [account] = await db<IAccountRow[]>`select email, terms_version, terms_accepted_at from accounts where id = ${session.accountId}`
    if (!account) {
        return notFound('Account not found')
    }
    return { ...account, canManageFamily: await isFamilyParentAccount(db, session.accountId, session.familyId) }
})
