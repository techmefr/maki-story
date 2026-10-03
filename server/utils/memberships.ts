import type { Sql, TransactionSql } from 'postgres'

type Db = Sql | TransactionSql

const STATUS_BY_MEMBER: Record<string, MembershipStatus> = { active: 'ACTIVE', invited: 'ACTIVE', left: 'LEFT', deceased: 'DECEASED', blocked: 'BLOCKED' }

export const syncMembershipStatus = async (db: Db, memberId: string, memberStatus: string): Promise<void> => {
    const status = STATUS_BY_MEMBER[memberStatus]
    if (status === undefined) {
        return
    }
    await db`update memberships set status = ${status}, updated_at = now() where member_id = ${memberId}`
}

export const hasParentLink = async (db: Db, accountId: string): Promise<boolean> => {
    const rows = await db`select 1 from account_families where account_id = ${accountId} limit 1`
    return rows.length > 0
}

export const relativeMemberFor = async (db: Db, accountId: string, familyId: string): Promise<string | null> => {
    const [row] = await db<{ memberId: string }[]>`
        select ms.member_id from memberships ms
        join members m on m.id = ms.member_id and m.deleted_at is null and m.status = 'active'
        join families f on f.id = ms.family_id and f.deleted_at is null
        where ms.account_id = ${accountId} and ms.family_id = ${familyId} and ms.status = 'ACTIVE' and ms.role = 'relative'
    `
    return row?.memberId ?? null
}

export const concernedChildIds = async (db: Db, accountId: string, familyId: string): Promise<string[] | null> => {
    const [row] = await db<{ childIds: string[] }[]>`
        select child_ids from memberships where account_id = ${accountId} and family_id = ${familyId} and role = 'relative'
    `
    return row && row.childIds.length > 0 ? row.childIds : null
}

export const assertChildConcerned = async (db: Db, accountId: string, familyId: string, role: MemberRole, childId: string): Promise<void> => {
    if (role !== 'relative') {
        return
    }
    const childIds = await concernedChildIds(db, accountId, familyId)
    if (childIds !== null && !childIds.includes(childId)) {
        throw createError({ statusCode: 403, statusMessage: 'This child is not part of your circle' })
    }
}

export const listMemberships = async (db: Db, accountId: string): Promise<IMembership[]> => {
    return db<IMembership[]>`
        select ms.family_id, f.name as family_name, ms.member_id, ms.role, ms.status,
            (select count(*)::int from members c where c.family_id = ms.family_id and c.role = 'child' and c.deleted_at is null) as child_count
        from memberships ms join families f on f.id = ms.family_id and f.deleted_at is null
        where ms.account_id = ${accountId} order by ms.created_at
    `
}

export const isFamilyParentAccount = async (db: Db, accountId: string, familyId: string): Promise<boolean> => {
    const rows = await db`select 1 from account_families where account_id = ${accountId} and family_id = ${familyId}`
    return rows.length > 0
}
