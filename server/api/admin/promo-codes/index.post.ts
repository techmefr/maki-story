import { getDb } from '~~/server/utils/db'
import { requireInstanceAdmin } from '~~/server/utils/admin'
import { logEvent } from '~~/server/utils/log'
import { badRequest } from '~~/server/utils/validate'

const KINDS = ['premium_days', 'lifetime']
const CODE_PATTERN = /^[A-Z0-9-]{3,40}$/

interface IPromoBody {
    code?: string
    kind?: string
    days?: number
    maxUses?: number | null
    expiresAt?: string | null
    note?: string
}

export default defineEventHandler(async (event): Promise<{ code: string }> => {
    await requireInstanceAdmin(event)
    const body = await readBody<IPromoBody>(event)
    const code = typeof body.code === 'string' ? body.code.trim().toUpperCase() : ''
    if (!CODE_PATTERN.test(code)) {
        return badRequest('Invalid code')
    }
    if (typeof body.kind !== 'string' || !KINDS.includes(body.kind)) {
        return badRequest('Invalid kind')
    }
    const days = body.kind === 'premium_days' ? body.days : null
    if (body.kind === 'premium_days' && (!Number.isInteger(days) || (days as number) < 1)) {
        return badRequest('Invalid days')
    }
    const maxUses = body.maxUses ?? null
    if (maxUses !== null && (!Number.isInteger(maxUses) || maxUses < 1)) {
        return badRequest('Invalid max uses')
    }
    const expiresAt = body.expiresAt ?? null
    if (expiresAt !== null && Number.isNaN(Date.parse(expiresAt))) {
        return badRequest('Invalid expiry')
    }
    const note = typeof body.note === 'string' ? body.note.trim() : ''
    const [created] = await getDb()<{ code: string }[]>`
        insert into promo_codes (code, kind, days, max_uses, expires_at, note)
        values (${code}, ${body.kind}, ${days ?? null}, ${maxUses}, ${expiresAt}, ${note})
        on conflict (code) do nothing
        returning code
    `
    if (!created) {
        return badRequest('Code already exists')
    }
    logEvent(`Code promo créé : ${created.code}`)
    return created
})
