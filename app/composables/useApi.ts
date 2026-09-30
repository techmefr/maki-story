interface IApiOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
    body?: object | Blob
    headers?: Record<string, string>
}

export const useApi = () => {
    const config = useRuntimeConfig()
    const isSignedIn = useState<boolean | null>('session-state', () => null)

    const request = async <T>(path: string, options: IApiOptions = {}): Promise<T> => {
        try {
            const result: unknown = await $fetch(`${config.public.apiBase}/api${path}`, {
                method: options.method ?? 'GET',
                body: options.body,
                headers: options.headers,
                credentials: 'include',
            })
            return result as T
        } catch (error) {
            const status = (error as { statusCode?: number }).statusCode
            if (status === 401 && path !== '/auth/login') {
                isSignedIn.value = false
                await navigateTo('/login')
            }
            throw error
        }
    }

    return { request }
}
