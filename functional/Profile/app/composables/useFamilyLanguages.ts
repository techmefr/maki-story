export const useFamilyLanguages = () => {
    const { members } = useMembers()
    const { current } = useCurrentMember()

    const familyCodes = computed<string[]>(() => {
        const codes = new Set<string>([DEFAULT_LANGUAGE])
        for (const member of members.value) {
            member.spokenLanguages.forEach(code => codes.add(code))
        }
        return [...codes]
    })

    const optionsFor = (selected: string[]): ILanguage[] => {
        if (current.value?.role === 'parent') {
            return LANGUAGES
        }
        return LANGUAGES.filter(language => familyCodes.value.includes(language.code) || selected.includes(language.code))
    }

    return { familyCodes, optionsFor }
}
