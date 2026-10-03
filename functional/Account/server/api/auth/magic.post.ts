import { randomBytes } from 'node:crypto'
import { getDb } from '~~/server/utils/db'
import { logEvent } from '~~/server/utils/log'
import { normalizeEmail } from '~~/server/utils/validate'
import { sendMail } from '~~/technical/Mail/server/utils/mail'
import { mailText } from '~~/technical/Mail/server/utils/mailTexts'
import { assertIpBudget, recordIpHit } from '~~/technical/Auth/server/utils/throttle'
import { hashMagicToken, MAGIC_LINK_MINUTES } from '../../utils/magicLink'

const IP_BUDGET = 10

export default defineEventHandler(async (event): Promise<{ ok: boolean }> => {
    const body = await readBody<{ email?: string; locale?: string }>(event)
    const email = normalizeEmail(body.email)
    await assertIpBudget(event, 'magic', IP_BUDGET)
    await recordIpHit(event, 'magic')
    const db = getDb()
    const [account] = await db<{ id: string }[]>`select id from accounts where lower(email) = ${email}`
    if (account) {
        const token = randomBytes(32).toString('hex')
        await db`
            insert into magic_links (account_id, token_hash, expires_at)
            values (${account.id}, ${hashMagicToken(token)}, now() + make_interval(mins => ${MAGIC_LINK_MINUTES}))
        `
        const base = process.env.APP_BASE_URL ?? getRequestURL(event).origin
        const locale = typeof body.locale === 'string' ? body.locale : null
        await sendMail({
            to: email,
            subject: mailText(locale, 'magic.subject'),
            text: mailText(locale, 'magic.body', { link: `${base}/magic?token=${token}`, minutes: MAGIC_LINK_MINUTES }),
        })
        logEvent('Lien magique envoyé')
    }
    return { ok: true }
})
