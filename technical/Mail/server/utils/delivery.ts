import type { Sql, TransactionSql } from 'postgres'
import { APP_NAME } from '~~/shared/utils/appName'
import { accessForMember } from '~~/server/utils/parental'
import { mailText } from '~~/technical/Mail/server/utils/mailTexts'
import { mailDeliveryReady } from '~~/technical/Mail/server/utils/mail'
import { sendPush } from '~~/technical/Mail/server/utils/push'

type Db = Sql | TransactionSql

export interface IOutOfAppInput {
    familyId: string
    recipientMemberId: string | null
    kind: NotificationKind
    payload: Record<string, string | number>
    count?: number
}

interface IRecipient {
    id: string
    role: MemberRole
    appLocale: string | null
}

type Reason = 'opt_out' | 'schedule_lock' | 'no_target' | 'provider_failed' | ''
type Status = 'SENT' | 'SUPPRESSED' | 'FAILED' | 'QUEUED'

const loadRecipients = async (db: Db, input: IOutOfAppInput): Promise<IRecipient[]> => {
    return db<IRecipient[]>`
        select id, role, app_locale from members
        where family_id = ${input.familyId} and deleted_at is null and status = 'active' and source_member_id is null
            and (${input.recipientMemberId}::text is null and role = 'parent' or id = ${input.recipientMemberId}::text)
    `
}

const isEnabled = async (db: Db, memberId: string, kind: NotificationKind, channel: NotificationChannel): Promise<boolean> => {
    const [row] = await db<{ isEnabled: boolean }[]>`
        select is_enabled from notification_preferences where member_id = ${memberId} and kind = ${kind} and channel = ${channel}
    `
    return row?.isEnabled ?? true
}

const record = async (db: Db, familyId: string, memberId: string, kind: NotificationKind, channel: 'PUSH' | 'EMAIL', status: 'SENT' | 'SUPPRESSED' | 'FAILED', reason: Reason, provider: string): Promise<void> => {
    await db`
        insert into notification_deliveries (family_id, member_id, kind, channel, status, reason, provider)
        values (${familyId}, ${memberId}, ${kind}, ${channel}, ${status}, ${reason}, ${provider})
    `
}

const accountsFor = async (db: Db, familyId: string, member: IRecipient): Promise<string[]> => {
    const rows =
        member.role === 'parent'
            ? await db<{ id: string }[]>`
                select distinct a.id from accounts a
                where a.id in (select account_id from account_families where family_id = ${familyId})
                    or a.id in (select account_id from memberships where family_id = ${familyId} and role = 'parent' and status = 'ACTIVE')
            `
            : await db<{ id: string }[]>`
                select a.id from accounts a join memberships ms on ms.account_id = a.id
                where ms.member_id = ${member.id} and ms.family_id = ${familyId} and ms.status = 'ACTIVE'
            `
    return rows.map(row => row.id)
}

const queueForDigest = async (db: Db, input: IOutOfAppInput, memberId: string, accountId: string): Promise<void> => {
    await db`
        insert into notification_digest_items (family_id, member_id, account_id, kind, payload, count)
        values (${input.familyId}, ${memberId}, ${accountId}, ${input.kind}, ${db.json(input.payload)}, ${input.count ?? 1})
    `
}

export const notificationText = (locale: string | null, input: Pick<IOutOfAppInput, 'kind' | 'payload' | 'count'>): { title: string; body: string } => {
    const params = { ...input.payload, count: input.count ?? 1 }
    return { title: mailText(locale, 'notify.title', { app: APP_NAME }), body: mailText(locale, `notify.${input.kind}`, params) }
}

export const deliverOutOfApp = async (db: Db, input: IOutOfAppInput): Promise<void> => {
    for (const member of await loadRecipients(db, input)) {
        const wantsPush = await isEnabled(db, member.id, input.kind, 'PUSH')
        const wantsEmail = await isEnabled(db, member.id, input.kind, 'EMAIL')
        if (!wantsPush && !wantsEmail) {
            await record(db, input.familyId, member.id, input.kind, 'PUSH', 'SUPPRESSED', 'opt_out', '')
            continue
        }
        if (member.role === 'child' && !(await accessForMember(db as Sql, input.familyId, member.id)).isAllowed) {
            await record(db, input.familyId, member.id, input.kind, 'PUSH', 'SUPPRESSED', 'schedule_lock', '')
            continue
        }
        const text = notificationText(member.appLocale, input)
        let isPushed = false
        if (wantsPush) {
            const targets = await db<{ id: string; platform: PushPlatform; endpoint: string }[]>`
                select id, platform, endpoint from push_subscriptions
                where family_id = ${input.familyId} and member_id = ${member.id} and revoked_at is null
            `
            for (const target of targets) {
                const outcome = await sendPush(target, { ...text, kind: input.kind })
                if (outcome === 'GONE') {
                    await db`update push_subscriptions set revoked_at = now() where id = ${target.id}`
                } else {
                    await db`update push_subscriptions set last_used_at = now() where id = ${target.id}`
                }
                isPushed = isPushed || outcome === 'SENT'
                await record(db, input.familyId, member.id, input.kind, 'PUSH', outcome === 'SENT' ? 'SENT' : 'FAILED', outcome === 'SENT' ? '' : 'provider_failed', target.platform)
            }
        }
        if (isPushed) {
            continue
        }
        if (!wantsEmail) {
            await record(db, input.familyId, member.id, input.kind, 'EMAIL', 'SUPPRESSED', 'opt_out', '')
            continue
        }
        if (!mailDeliveryReady()) {
            continue
        }
        const accounts = await accountsFor(db, input.familyId, member)
        for (const accountId of accounts) {
            await queueForDigest(db, input, member.id, accountId)
        }
        if (accounts.length > 0) {
            await record(db, input.familyId, member.id, input.kind, 'EMAIL', 'QUEUED', '', 'digest')
        }
    }
}
