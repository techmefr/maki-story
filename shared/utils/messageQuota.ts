const MS_PER_MINUTE = 60000
const MINUTES_PER_HOUR = 60

export const isLiveMessage = (message: IMessage, now: number): boolean => {
    return message.status === 'ACTIVE' && (message.expiresAt === null || new Date(message.expiresAt).getTime() > now)
}

export const countsTowardQuota = (message: IMessage, now: number): boolean => isLiveMessage(message, now) && !message.isSaved

export const activeSentBetween = (messages: IMessage[], senderId: string, recipientId: string, now: number): IMessage[] => {
    return messages
        .filter(message => message.fromMemberId === senderId && message.toMemberId === recipientId && countsTowardQuota(message, now))
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export const quotaOf = (count: number, limit: number): IQuota => {
    const safe = Math.max(0, count)
    return { count: safe, limit, remaining: Math.max(0, limit - safe), isFull: safe >= limit }
}

export const remainingMs = (expiresAt: string | null, now: number): number | null => {
    if (expiresAt === null) {
        return null
    }
    return Math.max(0, new Date(expiresAt).getTime() - now)
}

export const remainingParts = (ms: number): { hours: number; minutes: number } => {
    const totalMinutes = Math.ceil(ms / MS_PER_MINUTE)
    return { hours: Math.floor(totalMinutes / MINUTES_PER_HOUR), minutes: totalMinutes % MINUTES_PER_HOUR }
}

export const messageConversation = (messages: IMessage[], senderId: string, recipientId: string, now: number): IMessage[] =>
    messages.filter(message => message.fromMemberId === senderId && message.toMemberId === recipientId && isLiveMessage(message, now))
        .sort((first, second) => first.createdAt.localeCompare(second.createdAt))
