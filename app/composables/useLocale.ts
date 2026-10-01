export const useLocale = () => {
    const { current } = useCurrentMember()
    const { updateSettings } = useMembers()

    const detected = computed(() => {
        if (!import.meta.client) {
            return DEFAULT_LOCALE
        }
        return pickLocale(navigator.languages?.length ? navigator.languages : [navigator.language])
    })
    const preference = computed(() => current.value?.appLocale ?? null)
    const locale = computed(() => preference.value ?? detected.value)
    const activeLocale = computed(() => (TRANSLATED_LOCALES.includes(locale.value) ? locale.value : DEFAULT_LOCALE))
    const isTranslated = (code: string): boolean => TRANSLATED_LOCALES.includes(code)

    const setLocale = async (code: string | null): Promise<void> => {
        if (current.value) {
            await updateSettings(current.value.id, { appLocale: code })
        }
    }

    return { languages: LANGUAGES, detected, preference, locale, activeLocale, isTranslated, setLocale }
}
