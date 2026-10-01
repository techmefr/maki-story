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
            if (result.isSignedIn && result.memberId && !isProfileUnlockedInSession()) {
                await request('/auth/profile', { method: 'POST', body: { memberId: null } })
                currentId.value = null
            }
        } catch (_error) {
            isSignedIn.value = false
        }
        return isSignedIn.value === true
    }

    const start = async (path: string, body: object): Promise<boolean> => {
        try {
            const result = await request<IAuthState>(path, { method: 'POST', body })
            nuxtApp.runWithContext(() => {
                clearNuxtState()
                useState<boolean | null>('session-state', () => null).value = result.isSignedIn
                useState<string | null>('current-member-id', () => null).value = result.memberId
            })
            return true
        } catch (_error) {
            return false
        }
    }

    const login = (email: string, password: string): Promise<boolean> => {
        return start('/auth/login', { email, password })
    }

    const register = (input: IRegisterInput): Promise<boolean> => {
        return start('/auth/register', input)
    }

    const logout = async (): Promise<void> => {
        try {
            await request('/auth/logout', { method: 'POST' })
        } catch (_error) {
            console.warn('La deconnexion n a pas pu etre confirmee par le serveur')
        }
        reloadNuxtApp({ path: '/login', persistState: false, force: true })
    }

    return { isSignedIn, check, login, register, logout }
}
