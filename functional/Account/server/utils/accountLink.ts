import type { Sql, TransactionSql } from 'postgres'

type Db = Sql | TransactionSql

export interface IAccountLink {
    familyId: string
    memberId: string | null
    isRelativeAccount: boolean
}

interface ILinkRow {
    familyId: string
    memberId: string | null
}

export const resolveAccountLink = async (db: Db, accountId: string): Promise<IAccountLink | null> => {
    const [parentLink] = await db<ILinkRow[]>`
        select af.family_id, null::text as member_id from account_families af join families f on f.id = af.family_id
        where af.account_id = ${accountId} and f.deleted_at is null order by af.created_at limit 1
    `
    if (parentLink) {
        return { ...parentLink, isRelativeAccount: false }
    }
    const [relativeLink] = await db<ILinkRow[]>`
        select ms.family_id, ms.member_id from memberships ms
        join families f on f.id = ms.family_id and f.deleted_at is null
        join members m on m.id = ms.member_id and m.deleted_at is null and m.status = 'active'
        where ms.account_id = ${accountId} and ms.status = 'ACTIVE' and ms.role = 'relative'
        order by ms.created_at limit 1
    `
    return relativeLink ? { ...relativeLink, isRelativeAccount: true } : null
}
