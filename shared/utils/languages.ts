export const DEFAULT_LANGUAGE = 'fr'
export const DEFAULT_LOCALE = DEFAULT_LANGUAGE
export const RTL_LOCALES = ['ar']
export const DRAFT_LOCALES = ['mg']

export const LANGUAGES: ILanguage[] = [
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'mg', label: 'Malagasy', flag: '🇲🇬' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'it', label: 'Italiano', flag: '🇮🇹' },
    { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
    { code: 'pt', label: 'Português', flag: '🇵🇹' },
    { code: 'zh', label: '中文', flag: '🇨🇳' },
    { code: 'ar', label: 'العربية', flag: '🇸🇦' },
]

export const languageLabel = (code: string): string => {
    const language = LANGUAGES.find(item => item.code === code)
    return language ? `${language.flag} ${language.label}` : code
}

export const isLanguageCode = (value: unknown): value is string => {
    return typeof value === 'string' && LANGUAGES.some(language => language.code === value)
}

export const pickLocale = (candidates: readonly string[]): string => {
    for (const candidate of candidates) {
        const base = candidate.toLowerCase().split('-')[0]
        if (isLanguageCode(base)) {
            return base
        }
    }
    return DEFAULT_LOCALE
}

export const textDirection = (code: string): 'ltr' | 'rtl' => (RTL_LOCALES.includes(code) ? 'rtl' : 'ltr')
