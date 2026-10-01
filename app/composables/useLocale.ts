export const useLocale = () => {
    const { current } = useCurrentMember()
    const { updateSettings } = useMembers()
    const { locale: shown, setLocale: applyLocale } = useI18n()

    const detected = computed(() => {
        if (!import.meta.client) {
            return DEFAULT_LOCALE
        }
        return pickLocale(navigator.languages?.length ? navigator.languages : [navigator.language])
    })
    const preference = computed(() => current.value?.appLocale ?? null)
    const locale = computed(() => preference.value ?? detected.value)
    const activeLocale = computed(() => (isLanguageCode(locale.value) ? locale.value : DEFAULT_LOCALE))

    const setLocale = async (code: string | null): Promise<void> => {
        if (current.value) {
            await updateSettings(current.value.id, { appLocale: code })
        }
    }

    const syncLocale = async (): Promise<void> => {
        if (shown.value !== activeLocale.value) {
            await applyLocale(activeLocale.value)
        }
    }

    return { languages: LANGUAGES, detected, preference, locale, activeLocale, setLocale, syncLocale }
}
