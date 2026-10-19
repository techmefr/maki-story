export const useNotificationPreferences = () => {
    const { t } = useI18n()
    const { loadPreferences, setPreference } = usePush()
    const { load: loadNotifications } = useNotifications()
    const preferences = ref<INotificationPreference[]>([])
    const isBusy = ref(false)
    const isLoaded = ref(false)
    const errorMessage = ref('')

    const isOn = (kind: NotificationKind, channel: NotificationChannel): boolean =>
        preferences.value.find(item => item.kind === kind && item.channel === channel)?.isEnabled ?? true

    const load = async (): Promise<void> => {
        isBusy.value = true
        errorMessage.value = ''
        try {
            preferences.value = await loadPreferences()
            isLoaded.value = true
        } catch (_error) {
            errorMessage.value = t('common.unknownError')
        } finally {
            isBusy.value = false
        }
    }

    const toggle = async (kind: NotificationKind, channel: NotificationChannel): Promise<void> => {
        if (isBusy.value || !isLoaded.value) {
            return
        }
        const next: INotificationPreference = { kind, channel, isEnabled: !isOn(kind, channel) }
        isBusy.value = true
        errorMessage.value = ''
        try {
            await setPreference(next)
            preferences.value = [...preferences.value.filter(item => !(item.kind === kind && item.channel === channel)), next]
            await loadNotifications()
        } catch (_error) {
            errorMessage.value = t('common.unknownError')
        } finally {
            isBusy.value = false
        }
    }

    return { isBusy, isLoaded, errorMessage, isOn, load, toggle }
}
