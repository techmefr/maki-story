export const useTagLabel = () => {
    const { locale } = useI18n()

    const labelOf = (tag: { slug: string; names: Record<string, string> }, language: string = locale.value): string => tagLabel(tag, language)

    return { labelOf }
}
