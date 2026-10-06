export const useGroupSend = () => {
    const { t } = useI18n()
    const { currentId } = useCurrentMember()
    const { quotaFor } = useMessageQuota()
    const { sendNow, cancel } = useOutbox()

    const statusFromItem = (item: IOutboxItem): TSendStatus => {
        if (item.status === 'sent') {
            return 'sent'
        }
        if (item.status === 'failed') {
            return item.errorStatus === 409 ? 'quota' : item.errorStatus === 403 ? 'blocked' : 'failed'
        }
        return 'queued'
    }

    const sendTo = async (member: IMember, recording: IRecording): Promise<ISendResult> => {
        if (!currentId.value) {
            return { id: member.id, name: member.name, status: 'failed' }
        }
        if (quotaFor(member.id).isFull) {
            return { id: member.id, name: member.name, status: 'quota' }
        }
        try {
            const item = await sendNow({
                kind: 'message',
                label: t('outbox.messageLabel', { name: member.name }),
                blob: recording.blob,
                mime: recording.mime,
                durationMs: recording.ms,
                payload: { fromMemberId: currentId.value, toMemberId: member.id, kind: 'NORMAL' },
            })
            const status = statusFromItem(item)
            if (item.status === 'failed') {
                await cancel(item.id)
            }
            return { id: member.id, name: member.name, status }
        } catch {
            return { id: member.id, name: member.name, status: 'failed' }
        }
    }

    const sendToEach = async (members: IMember[], recording: IRecording): Promise<ISendResult[]> => {
        const collected: ISendResult[] = []
        for (const member of members) {
            collected.push(await sendTo(member, recording))
        }
        return collected
    }

    return { sendToEach }
}
