export type DraftMode = 'simple' | 'casting'
export type DraftStep = 'book' | 'pages' | 'characters' | 'lines' | 'review'

export interface IDraftCharacter {
    key: number
    name: string
    color: VoiceColorId | null
    description: string
    isNarrator: boolean
    memberId: string | null
}

export interface IDraftPanel {
    key: number
    description: string
}

export interface IDraftPage {
    key: number
    fileId: string | null
    previewUrl: string
    kind: PageKind
    ttsFallback: boolean
    description: string
    panels: IDraftPanel[]
}

export interface IDraftLine {
    key: number
    pageIndex: number
    panelIndex: number | null
    characterKey: number | null
    text: string
    tone: string
    sceneDescription: string
}

export interface IDraftLineInput {
    pageIndex: number
    panelIndex: number | null
    characterKey: number | null
    texts: string[]
    tone: string
    sceneDescription: string
}

export const NARRATOR_NAME = 'Narrateur'

let nextKey = 1

export const useBookDraft = () => {
    const step = useState<DraftStep>('draft-step', () => 'book')
    const mode = useState<DraftMode>('draft-mode', () => 'casting')
    const readerId = useState<string | null>('draft-reader', () => null)
    const title = useState<string>('draft-title', () => '')
    const subtitle = useState<string>('draft-subtitle', () => '')
    const author = useState<string>('draft-author', () => '')
    const ageMin = useState<number | null>('draft-age-min', () => null)
    const ageMax = useState<number | null>('draft-age-max', () => null)
    const language = useState<string>('draft-language', () => DEFAULT_LANGUAGE)
    const type = useState<BookType>('draft-type', () => 'standard')
    const ttsFallback = useState<boolean>('draft-tts', () => false)
    const pages = useState<IDraftPage[]>('draft-pages', () => [])
    const characters = useState<IDraftCharacter[]>('draft-characters', () => [])
    const lines = useState<IDraftLine[]>('draft-lines', () => [])

    const isSimple = computed(() => mode.value === 'simple')
    const isComic = computed(() => type.value === 'comic')
    const isWordless = computed(() => type.value === 'wordless')
    const pageCount = computed(() => Math.max(1, pages.value.length))
    const narrator = computed(() => characters.value.find(character => character.isNarrator) ?? null)
    const hasLines = computed(() => lines.value.length > 0)
    const steps = computed<DraftStep[]>(() => {
        if (isWordless.value) {
            return ['book', 'pages', 'review']
        }
        return isSimple.value ? ['book', 'pages', 'lines', 'review'] : ['book', 'pages', 'characters', 'lines', 'review']
    })

    const effectiveCharacterKey = (line: IDraftLine): number | null => line.characterKey ?? narrator.value?.key ?? null
    const characterByKey = (key: number | null): IDraftCharacter | null => characters.value.find(item => item.key === key) ?? null
    const isCharacterUsed = (key: number): boolean => lines.value.some(line => effectiveCharacterKey(line) === key)
    const usedCharacters = computed(() => characters.value.filter(character => isCharacterUsed(character.key)))
    const voicelessCharacters = computed(() => {
        if (isSimple.value || isWordless.value) {
            return []
        }
        return characters.value.filter(character => character.memberId === null && (isCharacterUsed(character.key) || character.isNarrator))
    })
    const linesOfPage = (pageIndex: number): IDraftLine[] => lines.value.filter(line => line.pageIndex === pageIndex)
    const linesOfPanel = (pageIndex: number, panelIndex: number | null): IDraftLine[] => {
        return lines.value.filter(line => line.pageIndex === pageIndex && line.panelIndex === panelIndex)
    }

    const nextColor = (): VoiceColorId => {
        const used = characters.value.map(character => character.color)
        return (VOICE_COLORS.find(color => !used.includes(color.id)) ?? VOICE_COLORS[characters.value.length % VOICE_COLORS.length]!).id
    }

    const addCharacter = (name: string, memberId: string | null = null): IDraftCharacter => {
        const trimmed = name.trim()
        const existing = characters.value.find(character => character.name.toLowerCase() === trimmed.toLowerCase())
        if (existing) {
            return existing
        }
        const created: IDraftCharacter = {
            key: nextKey++,
            name: trimmed,
            color: nextColor(),
            description: '',
            isNarrator: trimmed.toLowerCase() === NARRATOR_NAME.toLowerCase() && narrator.value === null,
            memberId,
        }
        characters.value = [...characters.value, created]
        return created
    }

    const updateCharacter = (key: number, patch: Partial<Omit<IDraftCharacter, 'key'>>): void => {
        characters.value = characters.value.map(character => (character.key === key ? { ...character, ...patch } : character))
    }

    const setNarrator = (key: number): void => {
        characters.value = characters.value.map(character => ({ ...character, isNarrator: character.key === key }))
    }

    const removeCharacter = (key: number): void => {
        if (isCharacterUsed(key)) {
            return
        }
        characters.value = characters.value.filter(character => character.key !== key)
    }

    const ensureNarrator = (memberId: string | null): void => {
        if (narrator.value !== null) {
            return
        }
        const existing = characters.value.find(character => character.name.toLowerCase() === NARRATOR_NAME.toLowerCase())
        if (existing) {
            setNarrator(existing.key)
            return
        }
        const created = addCharacter(NARRATOR_NAME, memberId)
        setNarrator(created.key)
    }

    const setMode = (next: DraftMode): void => {
        mode.value = next
        if (next === 'casting') {
            ensureNarrator(readerId.value)
            const reader = readerId.value
            if (reader !== null) {
                characters.value = characters.value.map(character => (character.memberId === null ? { ...character, memberId: reader } : character))
            }
        }
    }

    const setReader = (memberId: string | null): void => {
        readerId.value = memberId
    }

    const reset = (nextMode: DraftMode, reader: string | null): void => {
        step.value = 'book'
        mode.value = nextMode
        readerId.value = reader
        title.value = ''
        subtitle.value = ''
        author.value = ''
        ageMin.value = null
        ageMax.value = null
        language.value = DEFAULT_LANGUAGE
        type.value = 'standard'
        ttsFallback.value = false
        pages.value = []
        characters.value = []
        lines.value = []
        ensureNarrator(reader)
    }

    const addPhoto = (fileId: string, previewUrl: string): void => {
        pages.value = [
            ...pages.value,
            { key: nextKey++, fileId, previewUrl, kind: 'content', ttsFallback: false, description: '', panels: [] },
        ]
    }

    const addEmptyPage = (): void => {
        pages.value = [
            ...pages.value,
            { key: nextKey++, fileId: null, previewUrl: '', kind: 'empty', ttsFallback: true, description: '', panels: [] },
        ]
    }

    const updatePage = (index: number, patch: Partial<Omit<IDraftPage, 'key' | 'fileId' | 'previewUrl' | 'panels'>>): void => {
        pages.value = pages.value.map((page, position) => (position === index ? { ...page, ...patch } : page))
    }

    const removePage = (index: number): void => {
        const target = Math.max(0, index - 1)
        lines.value = lines.value.map(line => {
            if (line.pageIndex === index) {
                return { ...line, pageIndex: target, panelIndex: null }
            }
            return line.pageIndex > index ? { ...line, pageIndex: line.pageIndex - 1 } : line
        })
        pages.value = pages.value.filter((_page, position) => position !== index)
    }

    const addPanel = (pageIndex: number): void => {
        pages.value = pages.value.map((page, position) =>
            position === pageIndex ? { ...page, panels: [...page.panels, { key: nextKey++, description: '' }] } : page,
        )
    }

    const updatePanel = (pageIndex: number, panelIndex: number, description: string): void => {
        pages.value = pages.value.map((page, position) =>
            position === pageIndex
                ? { ...page, panels: page.panels.map((panel, index) => (index === panelIndex ? { ...panel, description } : panel)) }
                : page,
        )
    }

    const removePanel = (pageIndex: number, panelIndex: number): void => {
        lines.value = lines.value.map(line => {
            if (line.pageIndex !== pageIndex || line.panelIndex === null) {
                return line
            }
            if (line.panelIndex === panelIndex) {
                return { ...line, panelIndex: null }
            }
            return line.panelIndex > panelIndex ? { ...line, panelIndex: line.panelIndex - 1 } : line
        })
        pages.value = pages.value.map((page, position) =>
            position === pageIndex ? { ...page, panels: page.panels.filter((_panel, index) => index !== panelIndex) } : page,
        )
    }

    const addLines = (input: IDraftLineInput): void => {
        const added = input.texts
            .map(text => text.trim())
            .filter(text => text !== '')
            .map(text => ({
                key: nextKey++,
                pageIndex: input.pageIndex,
                panelIndex: input.panelIndex,
                characterKey: input.characterKey,
                text,
                tone: input.tone.trim(),
                sceneDescription: input.sceneDescription.trim(),
            }))
        lines.value = [...lines.value, ...added]
    }

    const updateLine = (key: number, patch: Partial<Pick<IDraftLine, 'tone' | 'sceneDescription' | 'characterKey' | 'text'>>): void => {
        lines.value = lines.value.map(line => (line.key === key ? { ...line, ...patch } : line))
    }

    const removeLine = (key: number): void => {
        lines.value = lines.value.filter(line => line.key !== key)
    }

    const orderedLines = (): IDraftLine[] => {
        const sent = isWordless.value ? [] : [...lines.value]
        return sent
            .map((line, index) => ({ line, index }))
            .sort((a, b) => a.line.pageIndex - b.line.pageIndex || (a.line.panelIndex ?? -1) - (b.line.panelIndex ?? -1) || a.index - b.index)
            .map(item => item.line)
    }

    const toNewBook = (): INewBook => {
        const ordered = orderedLines()
        const cast = isSimple.value || isWordless.value ? [] : characters.value
        const asAge = (value: unknown): number | null => (typeof value === 'number' && Number.isInteger(value) ? value : null)
        return {
            title: title.value.trim(),
            subtitle: subtitle.value,
            author: author.value,
            ageMin: asAge(ageMin.value),
            ageMax: asAge(ageMax.value),
            language: language.value,
            type: type.value,
            ttsFallback: ttsFallback.value,
            kind: isSimple.value ? 'solo' : 'multi',
            soloMemberId: isSimple.value ? readerId.value : null,
            imageDesc: '',
            pageFileIds: [],
            pages: pages.value.map(page => ({
                fileId: page.fileId,
                kind: page.kind,
                ttsFallback: page.kind === 'empty' ? page.ttsFallback : false,
                description: page.description,
                panels: page.panels.map(panel => ({ description: panel.description })),
            })),
            characters: cast.map(character => ({
                name: character.name,
                color: character.color,
                description: character.description,
                isNarrator: character.isNarrator,
            })),
            lines: ordered.map(line => ({
                pageIndex: line.pageIndex,
                character: isSimple.value ? '' : (characterByKey(effectiveCharacterKey(line))?.name ?? ''),
                text: line.text,
                panelPosition: line.panelIndex ?? undefined,
                tone: line.tone,
                sceneDescription: line.sceneDescription,
            })),
        }
    }

    const memberIdsForSave = (): (string | null)[] => {
        return orderedLines().map(line => (isSimple.value ? readerId.value : (characterByKey(effectiveCharacterKey(line))?.memberId ?? null)))
    }

    return {
        step,
        mode,
        readerId,
        title,
        subtitle,
        author,
        ageMin,
        ageMax,
        language,
        type,
        ttsFallback,
        pages,
        characters,
        lines,
        isSimple,
        isComic,
        isWordless,
        pageCount,
        narrator,
        hasLines,
        steps,
        usedCharacters,
        voicelessCharacters,
        characterByKey,
        effectiveCharacterKey,
        isCharacterUsed,
        linesOfPage,
        linesOfPanel,
        addCharacter,
        updateCharacter,
        setNarrator,
        removeCharacter,
        setMode,
        setReader,
        reset,
        addPhoto,
        addEmptyPage,
        updatePage,
        removePage,
        addPanel,
        updatePanel,
        removePanel,
        addLines,
        updateLine,
        removeLine,
        toNewBook,
        memberIdsForSave,
    }
}
