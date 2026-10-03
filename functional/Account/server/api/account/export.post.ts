import { randomBytes } from 'node:crypto'
import { getDb } from '~~/server/utils/db'
import { actorEntry, record } from '~~/server/utils/journal'
import { logEvent } from '~~/server/utils/log'
import { EXPORT_LINK_DAYS } from '~~/shared/utils/legal'
import { assertIpBudget, recordIpHit } from '~~/technical/Auth/server/utils/throttle'
import { isFakeDelivery, renderLocalizedMail, sendMail } from '~~/technical/Mail/server/utils/mail'
import { requirePermission } from '~~/technical/Auth/server/utils/permissions'
import { hashMagicToken } from '../../utils/magicLink'

const IP_BUDGET = 10

export default defineEventHandler(async (event): Promise<IExportRequested> => {
    const actor = await requirePermission(event, 'family.export')
    await assertIpBudget(event, 'export-link', IP_BUDGET)
    await recordIpHit(event, 'export-link')
    const body = await readBody<{ locale?: string }>(event)
    const db = getDb()
    const [account] = await db<{ email: string }[]>`select email from accounts where id = ${actor.accountId}`
    if (!account) {
        throw createError({ statusCode: 404, statusMessage: 'Account not found' })
    }
    const token = randomBytes(32).toString('hex')
    await db`
        insert into export_links (family_id, account_id, token_hash, expires_at)
        values (${actor.familyId}, ${actor.accountId}, ${hashMagicToken(token)}, now() + make_interval(days => ${EXPORT_LINK_DAYS}))
    `
    await record(event, { ...actorEntry(actor), action: 'family.export_requested', entityType: 'family', entityId: actor.familyId })
    const base = (process.env.APP_BASE_URL ?? getRequestURL(event).origin).replace(/\/$/, '')
    const link = `${base}/api/account/export/${token}`
    const locale = typeof body.locale === 'string' ? body.locale : null
    const content = renderLocalizedMail(locale, { template: 'export_ready', params: { days: EXPORT_LINK_DAYS, url: link } }, base)
    const isEmailSent = await sendMail({ to: account.email, ...content })
    logEvent('Export demandé par e-mail')
    return isFakeDelivery() ? { ok: true, isEmailSent, link } : { ok: true, isEmailSent }
})
