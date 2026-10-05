import type { H3Event } from 'h3'
import type { Sql, TransactionSql } from 'postgres'
import { APP_NAME } from '../../shared/utils/appName'
import { generateInviteCode } from './inviteCode'
import { mailText } from '~~/technical/Mail/server/utils/mailTexts'

type Db = Sql | TransactionSql

export const DEFAULT_INVITATION_HOURS = 48
export const MAX_INVITATION_HOURS = 24 * 30
export const MAX_INVITATIONS_PER_HOUR = 30
export const CHANNELS: InvitationChannel[] = ['WHATSAPP', 'SMS', 'EMAIL', 'LINK']
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export interface IInvitationRow {
    id: string
    familyId: string
    familyName: string
    code: string
    channel: InvitationChannel
    contact: string | null
    name: string
    childIds: string[]
    memberId: string | null
    role: InvitationRole
    inviterName: string
    isUsable: boolean
}

export const invitationLink = (event: H3Event, code: string): string => {
    const base = process.env.APP_BASE_URL ?? getRequestURL(event).origin
    return `${base.replace(/\/$/, '')}/join/${code}`
}

export const invitationShareText = (locale: string | null, inviter: string, family: string, link: string): string => {
    return mailText(locale, 'invite.shareText', { app: APP_NAME, inviter, family, link })
}

export const newInvitationCode = async (db: Db): Promise<string> => {
    for (let attempt = 0; attempt < 5; attempt++) {
        const code = generateInviteCode()
        const taken = await db`select 1 from invitations where code = ${code}`
        if (taken.length === 0) {
            return code
        }
    }
    throw createError({ statusCode: 500, statusMessage: 'Could not generate an invitation code' })
}

export const findInvitation = async (db: Db, code: string): Promise<IInvitationRow | null> => {
    const [row] = await db<IInvitationRow[]>`
        select i.id, i.family_id, f.name as family_name, i.code, i.channel, i.contact, i.name, i.child_ids, i.member_id, i.role,
            coalesce(m.name, '') as inviter_name,
            (i.used_at is null and i.revoked_at is null and i.expires_at > now()) as is_usable
        from invitations i
        join families f on f.id = i.family_id and f.deleted_at is null
        left join members m on m.id = i.created_by_member_id
        where i.code = ${code}
    `
    return row ?? null
}
