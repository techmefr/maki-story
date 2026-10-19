import type { Sql } from 'postgres'
import { renderLocalizedMail, sendMail, mailDeliveryReady } from '~~/technical/Mail/server/utils/mail'
import { mailText, hasMailText } from '~~/technical/Mail/server/utils/mailTexts'
import { MAIL_DEFAULT_KIND_STYLE, MAIL_KIND_STYLE } from '~~/technical/Mail/server/utils/mailTemplates'
import { DIGEST_MAX_LINES, DIGEST_RETENTION_DAYS, DIGEST_STALE_DAYS, groupDigestItems } from '~~/technical/Mail/server/utils/digestRules'
import type { IDigestItem } from '~~/technical/Mail/server/utils/digestRules'
import { runDailyDigests } from './digestRunner'

interface IPendingItem extends IDigestItem {
    accountId: string
    email: string
    locale: string | null
}

interface IBatch {
    accountId: string
    email: string
    locale: string | null
    itemIds: string[]
    items: IDigestItem[]
}

export const sendDailyDigests = async (db: Sql): Promise<{ sent: number; failed: number }> => {
    if (!mailDeliveryReady()) {
        return { sent: 0, failed: 0 }
    }
    return runDailyDigests({
        pending: async (): Promise<IBatch[]> => {
            await db`delete from notification_digest_items where created_at < now() - ${DIGEST_RETENTION_DAYS} * interval '1 day'`
            await db`delete from notification_digests where created_at < now() - ${DIGEST_RETENTION_DAYS} * interval '1 day'`
            const rows = await db<IPendingItem[]>`
                select i.id, i.account_id, a.email, m.app_locale as locale, i.kind, i.payload, i.count
                from notification_digest_items i
                join accounts a on a.id = i.account_id
                join families f on f.id = i.family_id and f.deleted_at is null
                join members m on m.id = i.member_id and m.deleted_at is null and m.status = 'active'
                left join notification_preferences p on p.member_id = i.member_id and p.kind = i.kind and p.channel = 'EMAIL'
                where i.sent_at is null and i.created_at >= now() - ${DIGEST_STALE_DAYS} * interval '1 day'
                    and coalesce(p.is_enabled, true)
                    and (exists (select 1 from account_families af where af.account_id = i.account_id and af.family_id = i.family_id)
                        or exists (select 1 from memberships ms where ms.account_id = i.account_id and ms.family_id = i.family_id and ms.status = 'ACTIVE'))
                order by i.created_at, i.id
            `
            const batches = new Map<string, IBatch>()
            for (const row of rows) {
                const batch = batches.get(row.accountId) ?? { accountId: row.accountId, email: row.email, locale: row.locale, itemIds: [], items: [] }
                batch.itemIds.push(row.id)
                batch.items.push(row)
                batches.set(row.accountId, batch)
            }
            return [...batches.values()]
        },
        claim: async (batch, day): Promise<boolean> => {
            const claimed = await db`
                insert into notification_digests (account_id, digest_date, item_count)
                values (${batch.accountId}, ${day}::date, ${batch.itemIds.length})
                on conflict (account_id, digest_date) do nothing returning account_id
            `
            return claimed.length > 0
        },
        deliver: async batch => {
            const groups = groupDigestItems(batch.items)
            const lines = groups.slice(0, DIGEST_MAX_LINES).map(group => {
                const templateKey = `tpl.digestLine.${group.kind}`
                const text = hasMailText(batch.locale, templateKey)
                    ? mailText(batch.locale, templateKey, { ...group.payload, count: group.count })
                    : mailText(batch.locale, `notify.${group.kind}`, { ...group.payload, count: group.count })
                return { ...(MAIL_KIND_STYLE[group.kind] ?? MAIL_DEFAULT_KIND_STYLE), text, badge: group.count > 1 ? String(group.count) : '' }
            })
            if (groups.length > DIGEST_MAX_LINES) {
                lines.push({ ...MAIL_DEFAULT_KIND_STYLE, text: mailText(batch.locale, 'tpl.digest.more', { count: groups.length - DIGEST_MAX_LINES }), badge: '' })
            }
            const rendered = renderLocalizedMail(batch.locale, { template: 'digest', params: { count: batch.items.reduce((total, item) => total + item.count, 0) }, lines })
            return sendMail({ to: batch.email, ...rendered })
        },
        complete: async batch => {
            await db`update notification_digest_items set sent_at = now() where id in ${db(batch.itemIds)} and account_id = ${batch.accountId}`
        },
    })
}
