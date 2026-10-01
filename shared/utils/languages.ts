export const DEFAULT_LANGUAGE = 'fr'
export const DEFAULT_LOCALE = DEFAULT_LANGUAGE
export const TRANSLATED_LOCALES = ['fr']

export const LANGUAGES: ILanguage[] = [
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'mg', label: 'Malgache', flag: '🇲🇬' },
    { code: 'en', label: 'Anglais', flag: '🇬🇧' },
    { code: 'es', label: 'Espagnol', flag: '🇪🇸' },
    { code: 'it', label: 'Italien', flag: '🇮🇹' },
    { code: 'de', label: 'Allemand', flag: '🇩🇪' },
    { code: 'pt', label: 'Portugais', flag: '🇵🇹' },
    { code: 'zh', label: 'Chinois', flag: '🇨🇳' },
    { code: 'ar', label: 'Arabe', flag: '🇸🇦' },
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
