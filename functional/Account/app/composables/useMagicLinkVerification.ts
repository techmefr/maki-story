export const useMagicLinkVerification = () => {
    const { verifyMagicLink } = useSession()
    const { landingPath } = useFamilies()
    const { t } = useI18n()
    const route = useRoute()
    const phase = ref<'checking' | 'success' | 'failed'>('checking')
    const failure = ref('')

    const verify = async (): Promise<void> => {
        const result = await verifyMagicLink(String(route.query.token ?? ''))
        if (result.status === 'ok') {
            phase.value = 'success'
            return
        }
        phase.value = 'failed'
        failure.value = result.status === 'unreachable' ? t('auth.login.unreachable') : result.status === 'error' ? t('auth.login.serverError') : result.status === 'invalid' && result.reason === 'used' ? t('auth.magic.used') : t('auth.magic.expired')
    }

    const proceed = async (): Promise<void> => {
        await navigateTo(await landingPath())
    }

    return { phase, failure, verify, proceed }
}
