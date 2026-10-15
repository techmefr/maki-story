import { defaultFamilyPlan } from '~~/server/utils/plan'
import { getDb, one } from '~~/server/utils/db'
import { logEvent } from '~~/server/utils/log'
import { renderLocalizedMail, sendMail } from '~~/technical/Mail/server/utils/mail'
import { hashPassword } from '~~/technical/Auth/server/utils/password'
import { startSession } from '~~/technical/Auth/server/utils/session'
import { assertIpBudget, recordIpHit } from '~~/technical/Auth/server/utils/throttle'
import { badRequest, isNonEmptyString, normalizeEmail } from '~~/server/utils/validate'

const MIN_PASSWORD_LENGTH = 8
const MAX_PASSWORD_LENGTH = 200
const MAX_NAME_LENGTH = 60
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const DEFAULT_REGISTRATIONS_PER_WINDOW = 20
const DEFAULT_PARENT_COLOR: VoiceColorId = 'sun'

export default defineEventHandler(async (event): Promise<IAuthState> => {
    const limit = Number(process.env.REGISTER_IP_LIMIT) || DEFAULT_REGISTRATIONS_PER_WINDOW
    await assertIpBudget(event, 'register', limit)
    await recordIpHit(event, 'register')
    const body = await readBody<Partial<IRegisterInput>>(event)
    const email = normalizeEmail(body.email)
    const password = typeof body.password === 'string' ? body.password : ''
    if (!EMAIL_PATTERN.test(email)) {
        return badRequest('Invalid e-mail')
    }
    if (password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
        return badRequest('Invalid password')
    }
    if (!isNonEmptyString(body.familyName) || !isNonEmptyString(body.parentName)) {
        return badRequest('A family name and a first name are required')
    }
    const familyName = body.familyName.trim().slice(0, MAX_NAME_LENGTH)
    const parentName = body.parentName.trim().slice(0, MAX_NAME_LENGTH)
    const db = getDb()
    const [existing] = await db<{ id: string }[]>`select id from accounts where lower(email) = ${email}`
    if (existing) {
        throw createError({ statusCode: 409, statusMessage: 'This e-mail is already registered' })
    }
    const passwordHash = await hashPassword(password)
    const legacyOwner = (process.env.LEGACY_OWNER_EMAIL ?? '').trim().toLowerCase()
    const session = await db.begin(async tx => {
        const account = one(await tx<{ id: string }[]>`
            insert into accounts (email, password_hash) values (${email}, ${passwordHash}) returning id
        `)
        const [legacy] =
            legacyOwner !== '' && legacyOwner === email
                ? await tx<{ id: string }[]>`
                    update families set owner_pending = false
                    where id = (select id from families where owner_pending order by created_at limit 1 for update)
                    returning id
                `
                : []
        let familyId = legacy?.id
        if (!familyId) {
            familyId = one(await tx<{ id: string }[]>`
                insert into families (name, invite_code, plan)
                values (${familyName}, substr(md5(random()::text || clock_timestamp()::text), 1, 10), ${defaultFamilyPlan()})
                returning id
            `).id
            await tx`
                insert into members (family_id, name, role, color) values (${familyId}, ${parentName}, 'parent', ${DEFAULT_PARENT_COLOR})
            `
        }
        await tx`insert into account_families (account_id, family_id) values (${account.id}, ${familyId})`
        await tx`
            insert into memberships (account_id, family_id, role) values (${account.id}, ${familyId}, 'parent')
            on conflict (account_id, family_id) do nothing
        `
        return { accountId: account.id, familyId, memberId: null }
    })
    startSession(event, session)
    const base = process.env.APP_BASE_URL ?? getRequestURL(event).origin
    const locale = typeof body.locale === 'string' ? body.locale : null
    const welcome = renderLocalizedMail(locale, { template: 'welcome', params: { name: parentName, family: familyName, url: `${base}/family/invite` } }, base)
    await sendMail({ to: email, ...welcome })
    logEvent('Compte créé')
    return { isSignedIn: true, memberId: null }
})
