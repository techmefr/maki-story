export const useAccount = () => {
    const { request } = useApi()
    const { locale } = useI18n()
    const info = useState<IAccountInfo | null>('account-info', () => null)

    const load = async (): Promise<IAccountInfo | null> => {
        try {
            info.value = await request<IAccountInfo>('/account')
        } catch (_error) {
            info.value = null
        }
        return info.value
    }

    const acceptTerms = async (): Promise<boolean> => {
        try {
            await request('/account/consent', { method: 'POST', body: { version: TERMS_VERSION } })
            return true
        } catch (_error) {
            return false
        }
    }

    const requestExport = (): Promise<IExportRequested> => request<IExportRequested>('/account/export', { method: 'POST', body: { locale: locale.value } })

    const removeFamily = async (code: string, word: string): Promise<void> => {
        await request('/family', { method: 'DELETE', body: { code, confirmWord: word, locale: locale.value } })
    }

    const requestCodeReset = async (email: string): Promise<boolean> => {
        try {
            await request('/auth/code-reset', { method: 'POST', body: { email, locale: locale.value } })
            return true
        } catch (_error) {
            return false
        }
    }

    return { info, load, acceptTerms, requestExport, removeFamily, requestCodeReset }
}

export const safeNextPath = (value: unknown, fallback: string): string => {
    const path = typeof value === 'string' ? value : ''
    return path.startsWith('/') && !path.startsWith('//') ? path : fallback
}
