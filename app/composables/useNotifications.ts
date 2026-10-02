const text = (value: string | number | undefined): string => (value === undefined ? '' : String(value))

export const describeNotification = (notification: INotification, t: (key: string, params?: Record<string, string | number>) => string): string => {
    const { payload, count } = notification
    const from = text(payload.fromName) || text(payload.familyName)
    const title = text(payload.bookTitle)
    const familyName = text(payload.familyName)
    switch (notification.kind) {
        case 'share_received':
            return t(text(payload.mode) === 'record' ? 'notifications.describe.receivedRecord' : 'notifications.describe.receivedCopy', { from, title })
        case 'share_accepted':
            return t('notifications.describe.accepted', { name: familyName, title })
        case 'share_declined':
            return t('notifications.describe.declined', { name: familyName, title })
        case 'share_to_approve':
            return t('notifications.describe.toApprove', { from, title })
        case 'share_approved':
            return t('notifications.describe.approved', { title })
        case 'voice_batch':
            return t('notifications.describe.voiceBatch', { from, title, count })
        case 'recording_batch':
            return t('notifications.describe.recordingBatch', { name: text(payload.memberName), title, count })
        case 'message_received':
            return t('alerts.describe.messageReceived', { from: text(payload.fromName), child: text(payload.childName) })
        case 'birthday_reminder':
            return t('alerts.describe.birthdayReminder', { child: text(payload.childName), days: Number(payload.days) })
        case 'stale_takes':
            return t('alerts.describe.staleTakes', { title, count })
        case 'review_result': {
            const parts = [
                Number(payload.approved) > 0 ? t('review.notice.approved', { count: Number(payload.approved) }) : '',
                Number(payload.returned) > 0 ? t('review.notice.returned', { count: Number(payload.returned) }) : '',
            ]
            return t('review.notice.result', { title, parts: parts.filter(part => part !== '').join(', ') })
        }
        case 'recording_request':
            return t('library.notify.recordingRequest', { title, count })
        case 'book_proposed':
            return t('library.notify.bookProposed', { name: text(payload.memberName), title })
        case 'proposal_result':
            return t(text(payload.decision) === 'approve' ? 'library.notify.proposalApproved' : 'library.notify.proposalDeclined', { title })
        default:
            return t('notifications.describe.default')
    }
}

export const useNotifications = () => {
    const { request } = useApi()
    const items = useState<INotification[]>('notifications', () => [])
    const unreadCount = useState<number>('notifications-unread', () => 0)

    const load = async (): Promise<void> => {
        try {
            const list = await request<INotificationList>('/notifications')
            items.value = list.items
            unreadCount.value = list.unreadCount
        } catch (_error) {
            items.value = []
            unreadCount.value = 0
        }
    }

    const markRead = async (ids?: string[]): Promise<void> => {
        await request('/notifications/read', { method: 'POST', body: ids ? { ids } : {} })
        await load()
    }

    return { items, unreadCount, load, markRead }
}
