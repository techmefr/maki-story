const mostFrequent = (ids: (string | null)[]): string | null => {
    const counts = new Map<string, number>()
    ids.forEach(id => {
        if (id !== null) {
            counts.set(id, (counts.get(id) ?? 0) + 1)
        }
    })
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
}

export const buildBookPageView = (book: IBook, pageIndex: number, language: string): IPageView => {
    const page = book.pages[pageIndex]
    const narrator = book.characters.find(character => character.isNarrator) ?? null
    const lines = book.lines.filter(line => line.pageIndex === pageIndex)
    const toViewLine = (line: ILine): IPageViewLine => {
        const translation = language !== book.language ? book.translations.find(item => item.lineId === line.id && item.language === language) : undefined
        return {
            id: line.id,
            text: translation?.text ?? line.text,
            originalText: translation ? line.text : null,
            tone: translation?.tone || line.tone,
            memberId: line.memberId,
        }
    }
    const characterOf = (line: ILine): string | null => line.characterId ?? narrator?.id ?? null
    const known = book.characters.map(character => {
        const own = lines.filter(line => characterOf(line) === character.id)
        return {
            id: character.id,
            name: character.name,
            color: character.isNarrator ? null : character.color,
            isNarrator: character.isNarrator,
            description: character.description,
            readerId: mostFrequent(own.map(line => line.memberId)),
            lines: own.map(toViewLine),
        }
    })
    const orphans = lines.filter(line => characterOf(line) === null)
    const characters: IPageViewCharacter[] = known.filter(character => character.lines.length > 0)
    if (orphans.length > 0) {
        characters.push({
            id: '',
            name: '',
            color: null,
            isNarrator: true,
            description: '',
            readerId: mostFrequent(orphans.map(line => line.memberId)),
            lines: orphans.map(toViewLine),
        })
    }
    return {
        fileId: page?.fileId ?? null,
        previewUrl: '',
        description: page?.description ?? '',
        panelCount: page?.panels.length ?? 0,
        characters,
    }
}
