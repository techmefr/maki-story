export const useFamilyLanguages = () => {
    const { members, ensureLoaded } = useMembers()

    const languages = computed(() =>
        familyLanguagesOf(
            members.value.filter(member => member.status === 'active'),
            LANGUAGES.map(language => language.code),
            DEFAULT_LANGUAGE,
        ),
    )

    return { languages, ensureLoaded }
}
