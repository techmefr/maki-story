const POLL_INTERVAL_MS = 10000

export const useMessages = () => {
    const { request } = useApi()
    const { currentId } = useCurrentMember()
    const { play } = useSoundCues()
    const messages = useState<IMessage[]>('messages', () => [])
    const pollTimer = useState<ReturnType<typeof setInterval> | null>('messages-timer', () => null)

    const load = async (): Promise<void> => {
        try {
            const previousIds = new Set(messages.value.map(message => message.id))
            const loaded = await request<IMessage[]>('/messages')
            const receiverId = currentId.value
            const hasNewIncoming =
                previousIds.size > 0 && loaded.some(message => !previousIds.has(message.id) && message.toMemberId === receiverId)
            messages.value = loaded
            if (hasNewIncoming) {
                play('message')
            }
        } catch (error) {
            console.error('Impossible de charger les messages pour le moment', error)
        }
    }

    const startPolling = (): void => {
        if (pollTimer.value) {
            return
        }
        pollTimer.value = setInterval(load, POLL_INTERVAL_MS)
    }

    const stopPolling = (): void => {
        if (pollTimer.value) {
            clearInterval(pollTimer.value)
            pollTimer.value = null
        }
    }

    const send = async (input: INewMessage): Promise<void> => {
        await request('/messages', { method: 'POST', body: input })
        await load()
    }

    const markListened = async (id: string): Promise<void> => {
        const result = await request<{ ok: boolean; expiresAt: string | null }>(`/messages/${id}/listen`, { method: 'POST' })
        const now = new Date().toISOString()
        messages.value = messages.value.map(message =>
            message.id === id && !message.firstListenedAt
                ? { ...message, listenedAt: now, firstListenedAt: now, expiresAt: result.expiresAt }
                : message,
        )
    }

    const remove = async (id: string): Promise<void> => {
        await request(`/messages/${id}`, { method: 'DELETE' })
        messages.value = messages.value.filter(message => message.id !== id)
    }

    const isLive = (message: IMessage): boolean => message.expiresAt === null || new Date(message.expiresAt).getTime() > Date.now()

    const between = (a: string, b: string): IMessage[] => {
        return messages.value.filter(
            message =>
                isLive(message) &&
                ((message.fromMemberId === a && message.toMemberId === b) || (message.fromMemberId === b && message.toMemberId === a)),
        )
    }

    const queueFrom = (senderId: string, receiverId: string): IMessage[] => {
        return messages.value
            .filter(message => message.fromMemberId === senderId && message.toMemberId === receiverId && isLive(message))
            .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    }

    const playableFrom = (senderId: string, receiverId: string): IMessage | null => {
        return queueFrom(senderId, receiverId)[0] ?? null
    }

    const unreadFrom = (senderId: string, receiverId: string): number => {
        return queueFrom(senderId, receiverId).filter(message => !message.firstListenedAt).length
    }

    const lastSentTo = (senderId: string, receiverId: string): IMessage | null => {
        return messages.value.find(message => message.fromMemberId === senderId && message.toMemberId === receiverId && isLive(message)) ?? null
    }

    const hasActiveTo = (senderId: string, receiverId: string, kind: MessageKind = 'NORMAL'): boolean => {
        return messages.value.some(
            message => message.fromMemberId === senderId && message.toMemberId === receiverId && message.kind === kind && isLive(message),
        )
    }

    const unreadCountFor = (receiverId: string): number => {
        return messages.value.filter(message => message.toMemberId === receiverId && !message.firstListenedAt && isLive(message)).length
    }

    return {
        messages,
        load,
        startPolling,
        stopPolling,
        send,
        markListened,
        between,
        queueFrom,
        playableFrom,
        unreadFrom,
        lastSentTo,
        hasActiveTo,
        remove,
        unreadCountFor,
        isLive,
    }
}
