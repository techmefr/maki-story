const ALLOWED_STATUS: IAccessStatus = { isAllowed: true, reason: null, resumeAt: null }
export const ACCESS_CLOSING_EVENT = 'tantara-access-closing'
export const ACCESS_FADE_MS = 1400

export const useAccess = () => {
    const config = useRuntimeConfig()
    const status = useState<IAccessStatus>('access-status', () => ALLOWED_STATUS)

    const refresh = async (): Promise<IAccessStatus> => {
        try {
            status.value = await $fetch<IAccessStatus>(`${config.public.apiBase}/api/access`, { credentials: 'include' })
        } catch (_error) {
            console.warn('L accès horaire n a pas pu être vérifié')
        }
        return status.value
    }

    const markLocked = (): void => {
        status.value = { isAllowed: false, reason: 'schedule', resumeAt: status.value.resumeAt }
    }

    const reset = (): void => {
        status.value = ALLOWED_STATUS
    }

    return { status, refresh, markLocked, reset }
}
