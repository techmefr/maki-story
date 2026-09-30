export const useSession = () => {
    const { request } = useApi()
    const isSignedIn = useState<boolean | null>('session-state', () => null)

    const check = async (): Promise<boolean> => {
        if (isSignedIn.value !== null) {
            return isSignedIn.value
        }
        try {
            const result = await request<{ isSignedIn: boolean }>('/auth/me')
            isSignedIn.value = result.isSignedIn
        } catch (_error) {
            isSignedIn.value = false
        }
        return isSignedIn.value === true
    }

    const login = async (email: string, password: string): Promise<boolean> => {
        try {
            await request('/auth/login', { method: 'POST', body: { email, password } })
            isSignedIn.value = true
            return true
        } catch (_error) {
            return false
        }
    }

    const logout = async (): Promise<void> => {
        try {
            await request('/auth/logout', { method: 'POST' })
        } catch (_error) {
            console.warn('La deconnexion n a pas pu etre confirmee par le serveur')
        }
        isSignedIn.value = false
        await navigateTo('/login')
    }

    return { isSignedIn, check, login, logout }
}
