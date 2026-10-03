export const useMessageQuota = () => {
    const { messages, load, remove } = useMessages()
    const { currentId } = useCurrentMember()
    const now = useMessageClock()

    const sentTo = (recipientId: string): IMessage[] => {
        return currentId.value ? activeSentBetween(messages.value, currentId.value, recipientId, now.value) : []
    }

    const heldFrom = (senderId: string): IMessage[] => {
        return currentId.value ? activeSentBetween(messages.value, senderId, currentId.value, now.value) : []
    }

    const quotaFor = (recipientId: string): IQuota => quotaOf(sentTo(recipientId).length, MESSAGE_MAX_ACTIVE)

    const quotaFrom = (senderId: string): IQuota => quotaOf(heldFrom(senderId).length, MESSAGE_MAX_ACTIVE)

    const retractOldest = async (recipientId: string): Promise<void> => {
        const oldest = sentTo(recipientId)[0]
        if (!oldest) {
            return
        }
        await remove(oldest.id)
        await load()
    }

    return { sentTo, heldFrom, quotaFor, quotaFrom, retractOldest }
}
