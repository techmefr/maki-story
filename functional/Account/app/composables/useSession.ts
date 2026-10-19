export type TAuthResult =
    | { status: 'ok' }
    | { status: 'invalid'; reason?: 'used' | 'expired' }
    | { status: 'throttled'; retryAfterMinutes: number }
    | { status: 'unreachable' }
    | { status: 'error' }

const toAuthFailure = (error: unknown): TAuthResult => {
    const failure = error as { statusCode?: number; status?: number; data?: { message?: string; statusMessage?: string; data?: { retryAfterSeconds?: number } } }
    const code = failure.statusCode ?? failure.status
    if (code === undefined || failure.data?.message === UNREACHABLE_MESSAGE) {
        return { status: 'unreachable' }
    }
    if (code === 429) {
        const seconds = failure.data?.data?.retryAfterSeconds ?? 60
        return { status: 'throttled', retryAfterMinutes: Math.max(1, Math.ceil(seconds / 60)) }
    }
    if (code === 410) {
        return { status: 'invalid', reason: failure.data?.statusMessage === 'This link was already used' ? 'used' : 'expired' }
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
    const isRelativeAccount = useState<boolean>('session-relative', () => false)

    const check = async (): Promise<boolean> => {
        if (isSignedIn.value !== null) {
            return isSignedIn.value
        }
        try {
            const result = await request<IAuthState>('/auth/me')
            isSignedIn.value = result.isSignedIn
            currentId.value = result.memberId
            isRelativeAccount.value = result.isRelativeAccount === true
        } catch (_error) {
            isSignedIn.value = false
            return false
        }
        if (isSignedIn.value && currentId.value && !isRelativeAccount.value && !isProfileUnlockedInSession()) {
            try {
                await request('/auth/profile', { method: 'POST', body: { memberId: null } })
                currentId.value = null
            } catch (_error) {
                console.warn('Le profil n a pas pu être verrouillé hors ligne')
            }
            currentId.value = null
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
                useState<boolean>('session-relative', () => false).value = result.isRelativeAccount === true
            })
            return { status: 'ok' }
        } catch (error) {
            return toAuthFailure(error)
        }
    }

    const login = (email: string, password: string): Promise<TAuthResult> => {
        return start('/auth/login', { email, password })
    }

    const requestMagicLink = async (email: string, locale: string): Promise<TAuthResult> => {
        try {
            await request('/auth/magic', { method: 'POST', body: { email, locale } })
            return { status: 'ok' }
        } catch (error) {
            return toAuthFailure(error)
        }
    }

    const verifyMagicLink = (token: string): Promise<TAuthResult> => {
        return start('/auth/magic/verify', { token })
    }

    const register = (input: IRegisterInput): Promise<TAuthResult> => {
        return start('/auth/register', input)
    }

    const logout = async (): Promise<void> => {
        try {
            await usePersonalDevice().disable()
        } catch (_error) {
            console.warn('L appareil personnel n a pas pu être révoqué côté serveur')
        }
        try {
            await request('/auth/logout', { method: 'POST' })
        } catch (_error) {
            console.warn('La deconnexion n a pas pu etre confirmee par le serveur')
        }
        await clearOfflineData()
        reloadNuxtApp({ path: '/login', persistState: false, force: true })
    }

    const switchFamily = async (familyId: string): Promise<void> => {
        const result = await request<IAuthState>('/auth/family', { method: 'POST', body: { familyId } })
        await clearOfflineData()
        nuxtApp.runWithContext(() => {
            clearNuxtState()
            useState<boolean | null>('session-state', () => null).value = result.isSignedIn
            useState<string | null>('current-member-id', () => null).value = result.memberId
            useState<boolean>('session-relative', () => false).value = result.isRelativeAccount === true
        })
    }

    const redeemInvitation = async (input: IInvitationRedeem): Promise<TAuthResult> => {
        try {
            const result = await request<IAuthState>('/invitations/redeem', { method: 'POST', body: input })
            await clearOfflineData()
            nuxtApp.runWithContext(() => {
                clearNuxtState()
                useState<boolean | null>('session-state', () => null).value = result.isSignedIn
                useState<string | null>('current-member-id', () => null).value = result.memberId
                useState<boolean>('session-relative', () => false).value = true
            })
            return { status: 'ok' }
        } catch (error) {
            return toAuthFailure(error)
        }
    }

    return { isSignedIn, isRelativeAccount, check, login, requestMagicLink, verifyMagicLink, register, logout, switchFamily, redeemInvitation }
}
