import { APP_NAME } from '../../../shared/utils/appName'
import { getDb } from '../../utils/db'
import { notificationText } from '../../utils/delivery'
import { mailText } from '../../utils/mailTexts'
import { loadActor } from '../../utils/permissions'

interface ILatestNotification {
    kind: NotificationKind
    payload: Record<string, string | number>
    count: number
}

export default defineEventHandler(async (event): Promise<{ title: string; body: string; kind: NotificationKind | null }> => {
    const actor = await loadActor(event)
    const db = getDb()
    const [member] = actor.memberId
        ? await db<{ appLocale: string | null }[]>`select app_locale from members where id = ${actor.memberId}`
        : []
    const locale = member?.appLocale ?? null
    const isParent = actor.role === 'parent'
    const [latest] = await db<ILatestNotification[]>`
        select kind, payload, count from notifications
        where family_id = ${actor.familyId} and read_at is null and (recipient_member_id = ${actor.memberId} or (recipient_member_id is null and ${isParent}))
        order by updated_at desc limit 1
    `
    if (!latest) {
        return { title: mailText(locale, 'notify.title', { app: APP_NAME }), body: mailText(locale, 'notify.generic'), kind: null }
    }
    return { ...notificationText(locale, latest), kind: latest.kind }
})
