import { getDb } from '~~/server/utils/db'
import { requireInstanceAdmin } from '~~/server/utils/admin'

interface IPromoCode {
    code: string
    kind: 'premium_days' | 'lifetime'
    days: number | null
    maxUses: number | null
    uses: number
    expiresAt: string | null
    note: string
}

export default defineEventHandler(async (event): Promise<IPromoCode[]> => {
    await requireInstanceAdmin(event)
    return getDb()<IPromoCode[]>`
        select code, kind, days, max_uses, uses, expires_at, note from promo_codes order by created_at desc
    `
})
