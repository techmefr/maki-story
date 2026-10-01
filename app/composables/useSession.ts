export type TAuthResult =
    | { status: 'ok' }
    | { status: 'invalid' }
    | { status: 'throttled'; retryAfterMinutes: number }
    | { status: 'unreachable' }
    | { status: 'error' }

const toAuthFailure = (error: unknown): TAuthResult => {
    const failure = error as { statusCode?: number; status?: number; data?: { data?: { retryAfterSeconds?: number } } }
    const code = failure.statusCode ?? failure.status
    if (code === undefined) {
        return { status: 'unreachable' }
    }
    if (code === 429) {
        const seconds = failure.data?.data?.retryAfterSeconds ?? 60
        return { status: 'throttled', retryAfterMinutes: Math.max(1, Math.ceil(seconds / 60)) }
    }
    if (code >= 500) {
        return { status: 'error' }
    }
    return { status: 'invalid' }
}

export const useSession = () => {
    const nuxtApp = useNuxtApp()
    const { request } = useApi()
    const isSignedIn = useState<boolean | null>('session-state', () => null)
    const currentId = useState<string | null>('current-member-id', () => null)

    const check = async (): Promise<boolean> => {
        if (isSignedIn.value !== null) {
            return isSignedIn.value
        }
        try {
            const result = await request<IAuthState>('/auth/me')
            isSignedIn.value = result.isSignedIn
            currentId.value = result.memberId
        } catch (_error) {
            isSignedIn.value = false
            return false
        }
        if (isSignedIn.value && currentId.value && !isProfileUnlockedInSession()) {
            try {
                await request('/auth/profile', { method: 'POST', body: { memberId: null } })
                currentId.value = null
            } catch (_error) {
                console.warn('Le profil n a pas pu être verrouillé hors ligne')
            }
        }
        return isSignedIn.value === true
    }

    const start = async (path: string, body: object): Promise<TAuthResult> => {
        try {
            const result = await request<IAuthState>(path, { method: 'POST', body })
            await clearOfflineData()
            nuxtApp.runWithContext(() => {
                clearNuxtState()
                useState<boolean | null>('session-state', () => null).value = result.isSignedIn
                useState<string | null>('current-member-id', () => null).value = result.memberId
            })
            return { status: 'ok' }
        } catch (error) {
            return toAuthFailure(error)
        }
    }

    const login = (email: string, password: string): Promise<TAuthResult> => {
        return start('/auth/login', { email, password })
    }

    const register = (input: IRegisterInput): Promise<TAuthResult> => {
        return start('/auth/register', input)
    }

    const logout = async (): Promise<void> => {
        try {
            await request('/auth/logout', { method: 'POST' })
        } catch (_error) {
            console.warn('La deconnexion n a pas pu etre confirmee par le serveur')
        }
        await clearOfflineData()
        reloadNuxtApp({ path: '/login', persistState: false, force: true })
    }

    return { isSignedIn, check, login, register, logout }
}
