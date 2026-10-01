const STORAGE_KEY = 'tantara-locale'

const cache = new Map<string, TMessages>()

const ensureLoaded = async (locale: string): Promise<TMessages> => {
    const known = cache.get(locale)
    if (known) {
        return known
    }
    const messages = await loadLocaleMessages(locale)
    cache.set(locale, messages)
    return messages
}

const browserLocale = (): string => pickLocale(navigator.languages?.length ? navigator.languages : [navigator.language])

export const initialLocale = (): string => {
    if (!import.meta.client) {
        return DEFAULT_LOCALE
    }
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (isLanguageCode(stored)) {
            return stored
        }
    } catch (_error) {
        return browserLocale()
    }
    return browserLocale()
}

export const useI18n = () => {
    const locale = useState<string>('i18n-locale', () => DEFAULT_LOCALE)
    const version = useState<number>('i18n-version', () => 0)

    const dir = computed(() => textDirection(locale.value))
    const isDraft = computed(() => DRAFT_LOCALES.includes(locale.value))

    const setLocale = async (code: string): Promise<void> => {
        const next = isLanguageCode(code) ? code : DEFAULT_LOCALE
        await Promise.all([ensureLoaded(DEFAULT_LOCALE), ensureLoaded(next)])
        locale.value = next
        version.value += 1
        if (import.meta.client) {
            try {
                localStorage.setItem(STORAGE_KEY, next)
            } catch (_error) {
                return
            }
        }
    }

    const t = (key: string, params?: TParams): string => {
        void version.value
        const current = translateMessage(cache.get(locale.value)?.[key], locale.value, params)
        if (current !== null) {
            return current
        }
        return translateMessage(cache.get(DEFAULT_LOCALE)?.[key], DEFAULT_LOCALE, params) ?? key
    }

    const formatNumber = (value: number, options?: Intl.NumberFormatOptions): string => new Intl.NumberFormat(locale.value, options).format(value)
    const formatDate = (value: Date | string | number, options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }): string =>
        new Intl.DateTimeFormat(locale.value, options).format(new Date(value))
    const formatDateTime = (value: Date | string | number): string => formatDate(value, { dateStyle: 'medium', timeStyle: 'short' })
    const formatDuration = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60)
        const rest = Math.round(seconds % 60)
        return `${formatNumber(minutes)}:${formatNumber(rest, { minimumIntegerDigits: 2 })}`
    }

    return { locale, dir, isDraft, setLocale, t, formatNumber, formatDate, formatDateTime, formatDuration }
}
