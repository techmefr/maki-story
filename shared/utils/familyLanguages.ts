export const familyLanguagesOf = (
    members: readonly { spokenLanguages: string[] }[],
    known: readonly string[],
    fallback: string,
): string[] => {
    const spoken = new Set(members.flatMap(member => member.spokenLanguages))
    const ordered = known.filter(code => spoken.has(code))
    return ordered.length > 0 ? ordered : [fallback]
}
