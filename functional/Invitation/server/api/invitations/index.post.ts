import { getDb, one } from '~~/server/utils/db'
import { assertMembersInFamily } from '~~/server/utils/family'
import { CHANNELS, DEFAULT_INVITATION_HOURS, EMAIL_PATTERN, MAX_INVITATIONS_PER_HOUR, MAX_INVITATION_HOURS, invitationLink, invitationShareText, newInvitationCode } from '~~/server/utils/invitations'
import { logEvent } from '~~/server/utils/log'
import { mailDeliveryReady, sendMail } from '~~/server/utils/mail'
import { mailText } from '~~/server/utils/mailTexts'
import { requireActorMember, requirePermission } from '~~/server/utils/permissions'
import { badRequest } from '~~/server/utils/validate'

const MAX_CONTACT_LENGTH = 200
const MAX_NAME_LENGTH = 60

export default defineEventHandler(async (event): Promise<IInvitationCreated> => {
    const actor = await requirePermission(event, 'family.invite')
    const { familyId } = actor
    const body = await readBody<Partial<IInvitationInput>>(event)
    if (!CHANNELS.includes(body.channel as InvitationChannel)) {
        return badRequest('Invalid channel')
    }
    const channel = body.channel as InvitationChannel
    const contact = typeof body.contact === 'string' ? body.contact.trim().slice(0, MAX_CONTACT_LENGTH) : ''
    if (channel === 'EMAIL' && !EMAIL_PATTERN.test(contact)) {
        return badRequest('An e-mail address is required')
    }
    const name = typeof body.name === 'string' ? body.name.trim().slice(0, MAX_NAME_LENGTH) : ''
    const hours = Math.min(MAX_INVITATION_HOURS, Math.max(1, Math.round(Number(body.expiresInHours) || DEFAULT_INVITATION_HOURS)))
    const childIds = Array.isArray(body.childIds) ? [...new Set(body.childIds.filter(id => typeof id === 'string'))] : []
    const db = getDb()
    if (childIds.length > 0) {
        await assertMembersInFamily(db, familyId, childIds)
        const children = await db`select id from members where family_id = ${familyId} and role = 'child' and id in ${db(childIds)}`
        if (children.length !== childIds.length) {
            return badRequest('Only children can be selected')
        }
    }
    let memberId: string | null = null
    if (typeof body.memberId === 'string' && body.memberId !== '') {
        const [relative] = await db<{ id: string }[]>`
            select m.id from members m
            where m.id = ${body.memberId} and m.family_id = ${familyId} and m.role = 'relative' and m.deleted_at is null and m.status = 'active'
                and m.source_member_id is null and not exists (select 1 from memberships ms where ms.member_id = m.id)
        `
        if (!relative) {
            return badRequest('This profile cannot be linked to an account')
        }
        memberId = relative.id
    }
    const recent = one(await db<{ count: number }[]>`
        select count(*)::int as count from invitations where family_id = ${familyId} and created_at > now() - interval '1 hour'
    `)
    if (recent.count >= MAX_INVITATIONS_PER_HOUR) {
        throw createError({ statusCode: 429, statusMessage: 'Too many invitations, try again later' })
    }
    const inviterId = requireActorMember(actor)
    const code = await newInvitationCode(db)
    const created = one(await db<IInvitation[]>`
        insert into invitations (family_id, code, channel, contact, name, child_ids, member_id, created_by_member_id, expires_at)
        values (${familyId}, ${code}, ${channel}, ${contact}, ${name}, ${childIds}, ${memberId}, ${inviterId}, now() + make_interval(hours => ${hours}))
        returning id, code, channel, coalesce(contact, '') as contact, name, child_ids, expires_at, used_at, revoked_at, created_at
    `)
    const [info] = await db<{ familyName: string; inviterName: string; locale: string | null }[]>`
        select f.name as family_name, m.name as inviter_name, m.app_locale as locale
        from families f, members m where f.id = ${familyId} and m.id = ${inviterId}
    `
    const link = invitationLink(event, code)
    const shareText = invitationShareText(info?.locale ?? null, info?.inviterName ?? '', info?.familyName ?? '', link)
    let isEmailSent = false
    if (channel === 'EMAIL' && mailDeliveryReady()) {
        isEmailSent = await sendMail({ to: contact, subject: mailText(info?.locale ?? null, 'invite.subject', { family: info?.familyName ?? '' }), text: shareText })
    }
    logEvent('Invitation créée')
    return { ...created, link, shareText, isEmailSent }
})
