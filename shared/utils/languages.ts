export const DEFAULT_LANGUAGE = 'fr'

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
