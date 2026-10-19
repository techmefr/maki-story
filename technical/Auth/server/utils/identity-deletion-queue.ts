import type { Sql } from 'postgres'

export const processIdentityDeletions = async (db: Sql, remove: (userId: string) => Promise<void>): Promise<{ removed: number; deferred: number; cancelled: number }> => db.begin(async tx => {
    const rows = await tx<{ userId: string }[]>`select user_id as "userId" from auth_identity_deletions order by last_attempt_at nulls first, created_at for update skip locked limit 5`
    const result = { removed: 0, deferred: 0, cancelled: 0 }
    for (const row of rows) {
        const [active] = await tx`select id from accounts where supabase_user_id = ${row.userId}`
        if (active) {
            await tx`delete from auth_identity_deletions where user_id = ${row.userId}`
            result.cancelled += 1
            continue
        }
        await tx`update auth_identity_deletions set attempts = attempts + 1, last_attempt_at = now() where user_id = ${row.userId}`
        try {
            await remove(row.userId)
            await tx`delete from auth_identity_deletions where user_id = ${row.userId}`
            result.removed += 1
        } catch {
            result.deferred += 1
        }
    }
    return result
})
