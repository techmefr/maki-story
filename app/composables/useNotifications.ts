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
