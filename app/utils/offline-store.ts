const DB_NAME = 'tantara-offline'
const BOOKS = 'books'
const KV = 'kv'
const AUDIO_CACHE = 'tantara-offline-audio'
const CACHED_PATHS = ['/auth/me', '/members', '/books']

const openDb = (): Promise<IDBDatabase> =>
    new Promise((resolve, reject) => {
        const opening = indexedDB.open(DB_NAME, 1)
        opening.onupgradeneeded = () => {
            opening.result.createObjectStore(BOOKS, { keyPath: 'id' })
            opening.result.createObjectStore(KV)
        }
        opening.onsuccess = () => resolve(opening.result)
        opening.onerror = () => reject(opening.error)
    })

const run = async <T>(store: string, mode: IDBTransactionMode, action: (target: IDBObjectStore) => IDBRequest<T>): Promise<T> => {
    const db = await openDb()
    return new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(store, mode)
        const pending = action(transaction.objectStore(store))
        transaction.oncomplete = () => {
            db.close()
            resolve(pending.result)
        }
        transaction.onerror = () => {
            db.close()
            reject(transaction.error)
        }
    })
}

export const offlineFileKey = (fileId: string): string => `${location.origin}/__offline/files/${fileId}`

export const isCacheablePath = (path: string): boolean => CACHED_PATHS.includes(path)

export const readOfflineEntry = async <T>(key: string): Promise<T | null> => {
    const value = await run<T | undefined>(KV, 'readonly', target => target.get(key))
    return value ?? null
}

export const writeOfflineEntry = async (key: string, value: unknown): Promise<void> => {
    await run(KV, 'readwrite', target => target.put(value, key))
}

export const readOfflineBook = async (id: string): Promise<IOfflineBook | null> => {
    const value = await run<IOfflineBook | undefined>(BOOKS, 'readonly', target => target.get(id))
    return value ?? null
}

export const listOfflineBooks = (): Promise<IOfflineBook[]> => run<IOfflineBook[]>(BOOKS, 'readonly', target => target.getAll())

export const writeOfflineBook = async (book: IOfflineBook): Promise<void> => {
    await run(BOOKS, 'readwrite', target => target.put(book))
}

export const hasOfflineFile = async (fileId: string): Promise<boolean> => {
    if (!('caches' in window)) {
        return false
    }
    const cache = await caches.open(AUDIO_CACHE)
    return (await cache.match(offlineFileKey(fileId))) !== undefined
}

export const readOfflineFile = async (fileId: string): Promise<Blob | null> => {
    if (!('caches' in window)) {
        return null
    }
    const cache = await caches.open(AUDIO_CACHE)
    const response = await cache.match(offlineFileKey(fileId))
    return response ? response.blob() : null
}

export const writeOfflineFile = async (fileId: string, blob: Blob): Promise<void> => {
    const cache = await caches.open(AUDIO_CACHE)
    await cache.put(offlineFileKey(fileId), new Response(blob, { headers: { 'content-type': blob.type } }))
}

export const deleteOfflineFile = async (fileId: string): Promise<void> => {
    const cache = await caches.open(AUDIO_CACHE)
    await cache.delete(offlineFileKey(fileId))
}

export const deleteOfflineBook = async (id: string): Promise<void> => {
    await run(BOOKS, 'readwrite', target => target.delete(id))
}

export const clearOfflineData = async (): Promise<void> => {
    try {
        await run(BOOKS, 'readwrite', target => target.clear())
        await run(KV, 'readwrite', target => target.clear())
        if ('caches' in window) {
            await caches.delete(AUDIO_CACHE)
        }
    } catch (error) {
        console.warn('Les données hors ligne n ont pas pu être effacées', error)
    }
}
