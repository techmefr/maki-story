import { getDb } from '~~/server/utils/db'
import { DUMMY_HASH, verifyPassword } from './password'
import { createSupabaseIdentity, supabaseEnabled, verifySupabasePassword } from './supabase'

export const verifyAccountPassword = async (accountId: string | null, email: string, password: string, legacyHash: string): Promise<boolean> => {
    if (!supabaseEnabled()) {
        return verifyPassword(password, legacyHash)
    }
    if (!accountId) {
        await verifyPassword(password, DUMMY_HASH)
        return false
    }
    return getDb().begin(async tx => {
        await tx`select pg_advisory_xact_lock(hashtext(${`supabase:${accountId}`}))`
        const [account] = await tx<{ supabaseUserId: string | null; passwordHash: string }[]>`select supabase_user_id, password_hash from accounts where id = ${accountId} for update`
        if (!account) {
            return false
        }
        if (account.supabaseUserId) {
            return (await verifySupabasePassword(email, password, account.supabaseUserId, accountId)) !== null
        }
        if (!(await verifyPassword(password, account.passwordHash))) {
            return false
        }
        const identity = await createSupabaseIdentity(accountId, email, password)
        await tx`update accounts set supabase_user_id = ${identity} where id = ${accountId}`
        return true
    })
}
