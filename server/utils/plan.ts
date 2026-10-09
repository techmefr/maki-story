import type { Sql, TransactionSql } from 'postgres'

type Db = Sql | TransactionSql

type FamilyPlan = IPlanUsage['plan']

interface IPlanLimits {
    books: number | null
    adults: number | null
}

export const FREE_BOOK_LIMIT = 12
export const FREE_ADULT_LIMIT = 8
export const PREMIUM_ADULT_LIMIT = 20

const LIMITS: Record<FamilyPlan, IPlanLimits> = {
    free: { books: FREE_BOOK_LIMIT, adults: FREE_ADULT_LIMIT },
    premium: { books: null, adults: PREMIUM_ADULT_LIMIT },
    lifetime: { books: null, adults: null },
}

const readPlan = (value: string | null | undefined): FamilyPlan => (value === 'premium' || value === 'lifetime' ? value : 'free')

export const defaultFamilyPlan = (): FamilyPlan => readPlan(process.env.DEFAULT_FAMILY_PLAN)

export const loadPlanUsage = async (db: Db, familyId: string): Promise<IPlanUsage> => {
    const [row] = await db<{ plan: string | null; books: number; adults: number; reserved: number }[]>`
        select
            (select plan from families where id = ${familyId}) as plan,
            (select count(*)::int from books where family_id = ${familyId}) as books,
            (select count(*)::int from members
                where family_id = ${familyId} and role in ('parent', 'relative') and status in ('active', 'invited') and deleted_at is null) as adults,
            (select count(*)::int from invitations
                where family_id = ${familyId} and used_at is null and revoked_at is null and expires_at > now() and member_id is null) as reserved
    `
    const plan = readPlan(row?.plan)
    return { plan, limits: LIMITS[plan], books: row?.books ?? 0, adults: (row?.adults ?? 0) + (row?.reserved ?? 0) }
}

const refuse = (code: 'plan_book_limit' | 'plan_adult_limit', limit: number): never => {
    throw createError({ statusCode: 402, statusMessage: code, data: { limit } })
}

export const assertCanCreateBooks = async (db: Db, familyId: string, count = 1): Promise<void> => {
    const usage = await loadPlanUsage(db, familyId)
    if (usage.limits.books !== null && usage.books + count > usage.limits.books) {
        refuse('plan_book_limit', usage.limits.books)
    }
}

export const assertCanAddAdult = async (db: Db, familyId: string): Promise<void> => {
    const usage = await loadPlanUsage(db, familyId)
    if (usage.limits.adults !== null && usage.adults + 1 > usage.limits.adults) {
        refuse('plan_adult_limit', usage.limits.adults)
    }
}
