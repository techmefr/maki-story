import { getDb } from '~~/server/utils/db'
import { logEvent } from '~~/server/utils/log'
import { loadPlanUsage } from '~~/server/utils/plan'
import { badRequest } from '~~/server/utils/validate'
import { requirePermission } from '~~/technical/Auth/server/utils/permissions'

const DAY_MS = 24 * 60 * 60 * 1000

interface IPromoRow {
    code: string
    kind: 'premium_days' | 'lifetime'
    days: number | null
}

export default defineEventHandler(async (event): Promise<IPlanUsage> => {
    const actor = await requirePermission(event, 'members.manage')
    const body = await readBody<{ code?: string }>(event)
    const code = typeof body.code === 'string' ? body.code.trim().toUpperCase() : ''
    if (code === '') {
        return badRequest('Invalid code')
    }
    const db = getDb()
    await db.begin(async tx => {
        const [promo] = await tx<IPromoRow[]>`
            update promo_codes set uses = uses + 1
            where code = ${code}
                and (max_uses is null or uses < max_uses)
                and (expires_at is null or expires_at > now())
            returning code, kind, days
        `
        if (!promo) {
            return badRequest('Code unavailable')
        }
        const [redeemed] = await tx<{ code: string }[]>`
            insert into promo_redemptions (code, family_id) values (${code}, ${actor.familyId})
            on conflict do nothing returning code
        `
        if (!redeemed) {
            return badRequest('Code already used')
        }
        if (promo.kind === 'lifetime') {
            await tx`update families set plan = 'lifetime', plan_until = null where id = ${actor.familyId}`
            return
        }
        const [family] = await tx<{ plan: string; planUntil: Date | null }[]>`select plan, plan_until from families where id = ${actor.familyId}`
        if (family?.plan === 'lifetime') {
            return
        }
        const base = family?.planUntil != null && family.planUntil.getTime() > Date.now() ? family.planUntil.getTime() : Date.now()
        const until = new Date(base + (promo.days ?? 0) * DAY_MS)
        await tx`update families set plan = 'premium', plan_until = ${until} where id = ${actor.familyId}`
    })
    logEvent(`Code promo utilisé : ${code}`)
    return loadPlanUsage(db, actor.familyId)
})
