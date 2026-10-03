const RETRY_DELAYS_MS = [4000, 12000, 36000, 120000, 300000]
const SENT_KEEP_MS = 60000
const FLUSH_INTERVAL_MS = 4000

export interface IEnqueueInput {
    kind: TOutboxKind
    label: string
    blob: Blob
    mime: string
    durationMs: number
    payload: IOutboxMessagePayload | IOutboxRecordingPayload
}

const plain = (item: IOutboxItem): IOutboxItem => ({ ...toRaw(item), blob: toRaw(item.blob), payload: { ...toRaw(item.payload) } })

const statusOf = (error: unknown): number | null => (error as { statusCode?: number }).statusCode ?? null

export const useOutbox = () => {
    const items = useState<IOutboxItem[]>('outbox-items', () => [])
    const isFlushing = useState<boolean>('outbox-flushing', () => false)
    const { currentId } = useCurrentMember()
    const { isOnline } = useConnectivity()
    const chunked = useChunkedUpload()
    const { setLineAudio } = useBooks()
    const { send: sendMessage } = useMessages()

    const mine = computed(() => items.value.filter(item => item.memberId === currentId.value))
    const pendingCount = computed(() => mine.value.filter(item => item.status !== 'sent').length)

    const replace = async (item: IOutboxItem): Promise<void> => {
        const stored = plain(item)
        items.value = items.value.map(entry => (entry.id === stored.id ? stored : entry))
        await writeOutboxItem(stored)
    }

    const load = async (): Promise<void> => {
        try {
            const stored = await listOutboxItems()
            const fresh: IOutboxItem[] = []
            for (const item of stored) {
                if (item.status === 'sent' && Date.now() - (item.sentAt ?? 0) > SENT_KEEP_MS) {
                    await deleteOutboxItem(item.id)
                    continue
                }
                fresh.push(item.status === 'sending' ? { ...item, status: 'pending' } : item)
            }
            items.value = fresh.sort((a, b) => a.createdAt - b.createdAt)
        } catch (error) {
            console.warn('La file d envoi n a pas pu être lue', error)
        }
    }

    const enqueue = async (input: IEnqueueInput): Promise<IOutboxItem> => {
        const memberId = currentId.value
        if (!memberId) {
            throw new Error('A profile is required to queue an item')
        }
        const item: IOutboxItem = {
            id: crypto.randomUUID(),
            kind: input.kind,
            memberId,
            label: input.label,
            status: 'pending',
            blob: input.blob,
            mime: input.mime,
            durationMs: input.durationMs,
            payload: input.payload,
            uploadId: null,
            fileId: null,
            attempts: 0,
            nextAttemptAt: 0,
            errorStatus: null,
            errorMessage: null,
            createdAt: Date.now(),
            sentAt: null,
        }
        items.value = [...items.value, item]
        await writeOutboxItem(item)
        return item
    }

    const complete = async (item: IOutboxItem, fileId: string): Promise<void> => {
        if (item.kind === 'message') {
            const payload = item.payload as IOutboxMessagePayload
            await sendMessage({ fromMemberId: payload.fromMemberId, toMemberId: payload.toMemberId, fileId, mime: item.mime, durationMs: item.durationMs })
            return
        }
        const payload = item.payload as IOutboxRecordingPayload
        await setLineAudio(payload.bookId, payload.lineId, fileId, item.durationMs, payload.language)
    }

    const process = async (queued: IOutboxItem): Promise<IOutboxItem> => {
        let item: IOutboxItem = { ...queued, status: 'sending', errorStatus: null, errorMessage: null }
        await replace(item)
        try {
            if (!item.fileId) {
                const fileId = await chunked.upload(item.blob, item.mime, {
                    uploadId: item.uploadId,
                    onSession: async id => {
                        item = { ...item, uploadId: id }
                        await replace(item)
                    },
                })
                item = { ...item, fileId }
                await replace(item)
            }
            await complete(item, item.fileId!)
            item = { ...item, status: 'sent', sentAt: Date.now(), blob: new Blob([], { type: item.mime }) }
        } catch (error) {
            const status = statusOf(error)
            if (isFatalUploadError(error)) {
                item = { ...item, status: 'failed', errorStatus: status, errorMessage: serverMessageOf(error) }
            } else {
                const delay = RETRY_DELAYS_MS[Math.min(item.attempts, RETRY_DELAYS_MS.length - 1)]!
                item = { ...item, status: 'pending', attempts: item.attempts + 1, nextAttemptAt: Date.now() + delay }
            }
        }
        await replace(item)
        return item
    }

    const flush = async (): Promise<void> => {
        if (isFlushing.value || !isOnline.value || !currentId.value) {
            return
        }
        isFlushing.value = true
        try {
            for (const item of items.value.filter(entry => entry.memberId === currentId.value && entry.status === 'pending').map(plain)) {
                if (item.nextAttemptAt <= Date.now() && isOnline.value) {
                    await process(item)
                }
            }
        } finally {
            isFlushing.value = false
        }
    }

    const sendNow = async (input: IEnqueueInput): Promise<IOutboxItem> => {
        while (isFlushing.value) {
            await new Promise(resolve => setTimeout(resolve, 100))
        }
        isFlushing.value = true
        try {
            const queued = await enqueue(input)
            return isOnline.value ? await process(queued) : queued
        } finally {
            isFlushing.value = false
        }
    }

    const retry = async (id: string): Promise<void> => {
        const item = items.value.find(entry => entry.id === id)
        if (!item) {
            return
        }
        await replace({ ...item, status: 'pending', attempts: 0, nextAttemptAt: 0, errorStatus: null, errorMessage: null })
        await flush()
    }

    const cancel = async (id: string): Promise<void> => {
        items.value = items.value.filter(entry => entry.id !== id)
        await deleteOutboxItem(id)
    }

    const dismissSent = async (): Promise<void> => {
        for (const item of items.value.filter(entry => entry.status === 'sent')) {
            await cancel(item.id)
        }
    }

    return { items, mine, pendingCount, load, enqueue, sendNow, flush, retry, cancel, dismissSent, FLUSH_INTERVAL_MS }
}
