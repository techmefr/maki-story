const RETRIES = 3

const wait = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))

const bytesOf = (record: IOfflineBook): number => Object.values(record.sizes).reduce((sum, size) => sum + size, 0)

export const useOfflineBooks = () => {
    const { t } = useI18n()
    const config = useRuntimeConfig()
    const { request } = useApi()
    const { current } = useCurrentMember()
    const records = useState<Record<string, IOfflineBook>>('offline-books', () => ({}))
    const progress = useState<Record<string, IOfflineProgress>>('offline-progress', () => ({}))
    const errors = useState<Record<string, string>>('offline-errors', () => ({}))
    const usage = useState<IStorageUsage>('offline-usage', () => ({ usedBytes: null, quotaBytes: null, isPersisted: false }))

    const list = computed(() => Object.values(records.value).sort((a, b) => a.title.localeCompare(b.title)))
    const totalBytes = computed(() => list.value.reduce((sum, record) => sum + bytesOf(record), 0))

    const isDownloaded = (id: string): boolean => records.value[id]?.isComplete === true
    const isPartial = (id: string): boolean => records.value[id] !== undefined && !records.value[id].isComplete
    const isBusy = (id: string): boolean => progress.value[id] !== undefined

    const refreshUsage = async (): Promise<void> => {
        const estimate = navigator.storage?.estimate ? await navigator.storage.estimate() : null
        const isPersisted = navigator.storage?.persisted ? await navigator.storage.persisted() : false
        usage.value = { usedBytes: estimate?.usage ?? null, quotaBytes: estimate?.quota ?? null, isPersisted }
    }

    const refresh = async (): Promise<void> => {
        try {
            const saved = await listOfflineBooks()
            records.value = Object.fromEntries(saved.map(record => [record.id, record]))
            await refreshUsage()
        } catch (error) {
            console.warn('Les livres hors ligne n ont pas pu être listés', error)
        }
    }

    const requestPersistence = async (): Promise<boolean> => {
        const isGranted = navigator.storage?.persist ? await navigator.storage.persist() : false
        await refreshUsage()
        return isGranted
    }

    const fetchFile = async (fileId: string): Promise<Blob> => {
        let lastError: unknown = null
        for (let attempt = 0; attempt < RETRIES; attempt++) {
            try {
                const response = await fetch(`${config.public.apiBase}/api/files/${fileId}`, { credentials: 'include' })
                if (!response.ok) {
                    throw new Error('File not found')
                }
                return await response.blob()
            } catch (error) {
                lastError = error
                await wait(400 * 2 ** attempt)
            }
        }
        throw lastError
    }

    const setProgress = (id: string, value: IOfflineProgress | null): void => {
        const next = { ...progress.value }
        if (value) {
            next[id] = value
        } else {
            delete next[id]
        }
        progress.value = next
    }

    const download = async (id: string): Promise<boolean> => {
        if (isBusy(id)) {
            return false
        }
        const { [id]: _cleared, ...otherErrors } = errors.value
        errors.value = otherErrors
        setProgress(id, { done: 0, total: 1 })
        try {
            const book = await request<IBook>(`/books/${id}`)
            const scanIds = current.value?.role === 'child' ? [] : book.pages.map(page => page.fileId)
            const fileIds = [...new Set([...book.lines.map(line => line.audioFileId), ...scanIds].filter((fileId): fileId is string => fileId !== null))]
            const sizes: Record<string, number> = { ...(records.value[id]?.sizes ?? {}) }
            const record: IOfflineBook = { id, title: book.title, book, fileIds, sizes, savedAt: new Date().toISOString(), isComplete: false }
            await writeOfflineBook(record)
            records.value = { ...records.value, [id]: record }
            let done = 0
            for (const fileId of fileIds) {
                if (sizes[fileId] === undefined || !(await hasOfflineFile(fileId))) {
                    const blob = await fetchFile(fileId)
                    await writeOfflineFile(fileId, blob)
                    sizes[fileId] = blob.size
                    await writeOfflineBook(record)
                }
                done += 1
                setProgress(id, { done, total: fileIds.length })
            }
            const complete: IOfflineBook = { ...record, sizes, isComplete: true }
            await writeOfflineBook(complete)
            records.value = { ...records.value, [id]: complete }
            await Promise.allSettled([preloadRouteComponents(`/kid/listen/${id}`), preloadRouteComponents(`/books/${id}/play`)])
            await refreshUsage()
            return true
        } catch (error) {
            const isQuota = error instanceof DOMException && error.name === 'QuotaExceededError'
            errors.value = {
                ...errors.value,
                [id]: isQuota ? t('books.offline.noSpace') : t('books.offline.interrupted'),
            }
            console.warn('Le téléchargement n a pas pu se terminer', error)
            return false
        } finally {
            setProgress(id, null)
        }
    }

    const remove = async (id: string): Promise<void> => {
        const record = records.value[id]
        if (!record) {
            return
        }
        const stillUsed = new Set(
            Object.values(records.value)
                .filter(item => item.id !== id)
                .flatMap(item => item.fileIds),
        )
        for (const fileId of record.fileIds) {
            if (!stillUsed.has(fileId)) {
                await deleteOfflineFile(fileId)
            }
        }
        await deleteOfflineBook(id)
        const { [id]: _removed, ...rest } = records.value
        records.value = rest
        await refreshUsage()
    }

    const removeAll = async (): Promise<void> => {
        for (const record of list.value) {
            await remove(record.id)
        }
    }

    return {
        records,
        list,
        totalBytes,
        usage,
        progress,
        errors,
        bytesOf,
        isDownloaded,
        isPartial,
        isBusy,
        refresh,
        refreshUsage,
        requestPersistence,
        download,
        remove,
        removeAll,
    }
}
