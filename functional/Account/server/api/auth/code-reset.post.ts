import { randomBytes } from 'node:crypto'
import { getDb } from '~~/server/utils/db'
import { logEvent } from '~~/server/utils/log'
import { normalizeEmail } from '~~/server/utils/validate'
import { renderLocalizedMail, sendMail } from '~~/technical/Mail/server/utils/mail'
import { assertIpBudget, recordIpHit } from '~~/technical/Auth/server/utils/throttle'
import { hashMagicToken, MAGIC_LINK_MINUTES } from '../../utils/magicLink'

const IP_BUDGET = 10

export default defineEventHandler(async (event): Promise<{ ok: boolean }> => {
    const body = await readBody<{ email?: string; locale?: string }>(event)
    const email = normalizeEmail(body.email)
    await assertIpBudget(event, 'code-reset', IP_BUDGET)
    await recordIpHit(event, 'code-reset')
    const db = getDb()
    const [account] = await db<{ id: string }[]>`select id from accounts where lower(email) = ${email}`
    if (account) {
        const token = randomBytes(32).toString('hex')
        await db`
            insert into magic_links (account_id, token_hash, purpose, expires_at)
            values (${account.id}, ${hashMagicToken(token)}, 'code_reset', now() + make_interval(mins => ${MAGIC_LINK_MINUTES}))
        `
        const base = process.env.APP_BASE_URL ?? getRequestURL(event).origin
        const locale = typeof body.locale === 'string' ? body.locale : null
        const content = renderLocalizedMail(locale, { template: 'code_reset', params: { minutes: MAGIC_LINK_MINUTES, url: `${base}/magic?token=${token}` } }, base)
        await sendMail({ to: email, ...content })
        logEvent('Lien de nouveau code envoyé')
    }
    return { ok: true }
})
