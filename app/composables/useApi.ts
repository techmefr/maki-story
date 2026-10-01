interface IApiOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
    body?: object | Blob
    headers?: Record<string, string>
}

const AUTH_PATHS = ['/auth/login', '/auth/register']
export const UNREACHABLE_MESSAGE = 'Impossible de joindre le serveur, réessaie'
const BOOK_PATH = /^\/books\/([^/]+)$/

const readSaved = async <T>(path: string): Promise<T | null> => {
    try {
        const bookId = BOOK_PATH.exec(path)?.[1]
        if (bookId) {
            const saved = await readOfflineBook(bookId)
            return (saved?.book as T | undefined) ?? null
        }
        return isCacheablePath(path) ? await readOfflineEntry<T>(`api:${path}`) : null
    } catch (_error) {
        return null
    }
}

const saveForOffline = async (path: string, result: unknown): Promise<void> => {
    try {
        if (isCacheablePath(path)) {
            await writeOfflineEntry(`api:${path}`, result)
        }
    } catch (_error) {
        console.warn('La copie hors ligne n a pas pu être enregistrée')
    }
}

export const useApi = () => {
    const config = useRuntimeConfig()
    const isSignedIn = useState<boolean | null>('session-state', () => null)
    const { isOnline, check } = useConnectivity()

    const request = async <T>(path: string, options: IApiOptions = {}): Promise<T> => {
        const isRead = (options.method ?? 'GET') === 'GET'
        try {
            const result: unknown = await $fetch(`${config.public.apiBase}/api${path}`, {
                method: options.method ?? 'GET',
                body: options.body,
                headers: options.headers,
                credentials: 'include',
            })
            isOnline.value = true
            if (isRead) {
                await saveForOffline(path, result)
            }
            return result as T
        } catch (error) {
            const status = (error as { statusCode?: number }).statusCode
            if (status === undefined) {
                void check()
                if (isRead) {
                    const saved = await readSaved<T>(path)
                    if (saved !== null) {
                        return saved
                    }
                } else {
                    throw createError({ statusMessage: UNREACHABLE_MESSAGE, data: { message: UNREACHABLE_MESSAGE }, cause: error })
                }
            }
            if (status === 401 && !AUTH_PATHS.includes(path)) {
                isSignedIn.value = false
                await navigateTo('/login')
            }
            if (status === 403 && (error as { data?: { data?: { code?: string } } }).data?.data?.code === 'outside-hours') {
                useAccess().markLocked()
                await navigateTo('/kid/locked')
            }
            throw error
        }
    }

    return { request }
}
