export const useMessageExpiry = () => {
    const { t } = useI18n()
    const now = useMessageClock()

    const remaining = (message: IMessage): number | null => (message.isSaved ? null : remainingMs(message.expiresAt, now.value))

    const label = (message: IMessage): string | null => {
        const ms = remaining(message)
        if (ms === null) {
            return null
        }
        const { hours, minutes } = remainingParts(ms)
        return hours > 0 ? t('messages.expiry.hoursMinutes', { hours, minutes }) : t('messages.expiry.minutes', { minutes })
    }

    const isExpiring = (message: IMessage): boolean => remaining(message) !== null

    return { now, remaining, label, isExpiring }
}
