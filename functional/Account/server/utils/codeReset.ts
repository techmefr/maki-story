import type { Sql, TransactionSql } from 'postgres'

type Db = Sql | TransactionSql

export const resetAdultCodes = async (db: Db, accountId: string): Promise<void> => {
    await db`
        update members set pin_hash = null, code_kind = null, code_failed_attempts = 0, code_locked_until = null
        where deleted_at is null and role <> 'child' and (
            id in (select member_id from memberships where account_id = ${accountId} and member_id is not null)
            or (
                role = 'parent'
                and family_id in (select family_id from account_families where account_id = ${accountId})
                and not exists (select 1 from memberships ms where ms.member_id = members.id)
            )
        )
    `
}
