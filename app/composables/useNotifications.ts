const MODE_VERBS: Record<string, string> = {
    record: 'vous demande d’enregistrer votre voix pour',
    copy: 'vous a envoyé le livre',
}

const text = (value: string | number | undefined): string => (value === undefined ? '' : String(value))

export const describeNotification = (notification: INotification): string => {
    const { payload, count } = notification
    const from = text(payload.fromName) || text(payload.familyName)
    const title = `« ${text(payload.bookTitle)} »`
    const lines = count > 1 ? `${count} répliques` : '1 réplique'
    switch (notification.kind) {
        case 'share_received':
            return `${from} ${MODE_VERBS[text(payload.mode)] ?? MODE_VERBS.copy} ${title}`
        case 'share_accepted':
            return `${text(payload.familyName)} a accepté ${title}`
        case 'share_declined':
            return `${text(payload.familyName)} a refusé ${title}`
        case 'share_to_approve':
            return `${from} propose ${title} : à valider`
        case 'share_approved':
            return `Ta proposition ${title} a été approuvée`
        case 'voice_batch':
            return `${from} a envoyé sa voix : ${lines} de ${title}`
        case 'recording_batch':
            return `${text(payload.memberName)} a fini d’enregistrer ${lines} de ${title}`
        default:
            return 'Nouvelle notification'
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
