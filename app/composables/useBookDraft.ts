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

export interface IDraftTranslation {
    language: string
    text: string
    tone: string
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
    translations: IDraftTranslation[]
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
    const { current } = useCurrentMember()
    const step = useState<DraftStep>('draft-step', () => 'book')
    const mode = useState<DraftMode>('draft-mode', () => 'casting')
    const readerId = useState<string | null>('draft-reader', () => null)
    const title = useState<string>('draft-title', () => '')
    const subtitle = useState<string>('draft-subtitle', () => '')
    const author = useState<string>('draft-author', () => '')
    const illustrator = useState<string>('draft-illustrator', () => '')
    const ageMin = useState<number | null>('draft-age-min', () => null)
    const ageMax = useState<number | null>('draft-age-max', () => null)
    const language = useState<string>('draft-language', () => DEFAULT_LANGUAGE)
    const voiceLanguages = useState<string[]>('draft-voice-languages', () => [])
    const moods = useState<string[]>('draft-moods', () => [])
    const themes = useState<string[]>('draft-themes', () => [])
    const type = useState<BookType>('draft-type', () => 'standard')
    const ttsFallback = useState<boolean>('draft-tts', () => false)
    const pages = useState<IDraftPage[]>('draft-pages', () => [])
    const characters = useState<IDraftCharacter[]>('draft-characters', () => [])
    const lines = useState<IDraftLine[]>('draft-lines', () => [])
    const isAiPrefilled = useState<boolean>('draft-ai-prefilled', () => false)
    const isProposal = useState<boolean>('draft-proposal', () => false)

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
        const used = characters.value.filter(character => !character.isNarrator).map(character => character.color)
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
            isNarrator: false,
            memberId,
        }
        characters.value = [...characters.value, created]
        return created
    }

    const updateCharacter = (key: number, patch: Partial<Omit<IDraftCharacter, 'key'>>): void => {
        characters.value = characters.value.map(character => (character.key === key ? { ...character, ...patch } : character))
    }

    const setNarrator = (key: number): void => {
        characters.value = characters.value.map(character => {
            if (character.key === key) {
                return { ...character, isNarrator: true, color: null }
            }
            return character.isNarrator ? { ...character, isNarrator: false, color: nextColor() } : character
        })
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
        const taken = characters.value.some(character => character.name.toLowerCase() === NARRATOR_NAME.toLowerCase())
        const created: IDraftCharacter = {
            key: nextKey++,
            name: taken ? `${NARRATOR_NAME} 1` : NARRATOR_NAME,
            color: null,
            description: '',
            isNarrator: true,
            memberId,
        }
        characters.value = [created, ...characters.value]
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
        illustrator.value = ''
        ageMin.value = null
        ageMax.value = null
        language.value = current.value?.spokenLanguages[0] ?? DEFAULT_LANGUAGE
        voiceLanguages.value = []
        moods.value = []
        themes.value = []
        type.value = 'standard'
        ttsFallback.value = false
        pages.value = []
        characters.value = []
        lines.value = []
        isAiPrefilled.value = false
        isProposal.value = false
        ensureNarrator(reader)
    }

    const loadAiDraft = (draft: IAiBookDraft): void => {
        title.value = draft.title
        subtitle.value = draft.subtitle
        language.value = draft.language
        voiceLanguages.value = voiceLanguages.value.length > 0 ? voiceLanguages.value : [draft.language]
        const reader = readerId.value
        const loaded: IDraftCharacter[] = draft.characters.map(character => ({
            key: nextKey++,
            name: character.name,
            color: character.color,
            description: character.description,
            isNarrator: character.isNarrator,
            memberId: character.isNarrator && !isSimple.value ? reader : null,
        }))
        const used = new Set<string>()
        characters.value = loaded.map(character => {
            if (character.isNarrator) {
                return { ...character, color: null }
            }
            if (character.color !== null && !used.has(character.color)) {
                used.add(character.color)
                return character
            }
            const free = VOICE_COLORS.find(color => !used.has(color.id))?.id ?? VOICE_COLORS[0]!.id
            used.add(free)
            return { ...character, color: free }
        })
        if (narrator.value === null) {
            ensureNarrator(reader)
        }
        const lastPage = Math.max(0, pages.value.length - 1)
        pages.value = pages.value.map((page, position) => {
            const proposal = draft.pages[position]
            if (!proposal || page.kind === 'empty') {
                return page
            }
            return {
                ...page,
                description: proposal.imageDescription,
                panels: proposal.panels.map(description => ({ key: nextKey++, description })),
            }
        })
        if (pages.value.some(page => page.panels.length > 0)) {
            type.value = 'comic'
        }
        lines.value = draft.lines.map(line => ({
            key: nextKey++,
            pageIndex: Math.min(Math.max(0, line.pageIndex), lastPage),
            panelIndex: null,
            characterKey: characters.value.find(character => character.name.toLowerCase() === line.character.trim().toLowerCase())?.key ?? null,
            text: line.text,
            tone: line.tone,
            sceneDescription: line.sceneDescription,
            translations: [],
        }))
        isAiPrefilled.value = true
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
                translations: [],
            }))
        lines.value = [...lines.value, ...added]
    }

    const updateLine = (key: number, patch: Partial<Pick<IDraftLine, 'tone' | 'sceneDescription' | 'characterKey' | 'text'>>): void => {
        lines.value = lines.value.map(line => (line.key === key ? { ...line, ...patch } : line))
    }

    const setTranslation = (key: number, translation: IDraftTranslation): void => {
        lines.value = lines.value.map(line =>
            line.key === key
                ? { ...line, translations: [...line.translations.filter(item => item.language !== translation.language), translation] }
                : line,
        )
    }

    const removeTranslation = (key: number, languageCode: string): void => {
        lines.value = lines.value.map(line =>
            line.key === key ? { ...line, translations: line.translations.filter(item => item.language !== languageCode) } : line,
        )
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
            illustrator: illustrator.value,
            ageMin: asAge(ageMin.value),
            ageMax: asAge(ageMax.value),
            language: language.value,
            writtenLanguage: language.value,
            voiceLanguages: voiceLanguages.value.length > 0 ? voiceLanguages.value : [language.value],
            moods: moods.value,
            themes: themes.value,
            type: type.value,
            ttsFallback: ttsFallback.value,
            kind: isSimple.value ? 'solo' : 'multi',
            soloMemberId: isSimple.value ? readerId.value : null,
            isProposal: isProposal.value ? true : undefined,
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

    const translationsForSave = (): (IDraftTranslation[])[] => orderedLines().map(line => line.translations)

    return {
        isProposal,
        step,
        mode,
        readerId,
        title,
        subtitle,
        author,
        illustrator,
        ageMin,
        ageMax,
        language,
        voiceLanguages,
        moods,
        themes,
        type,
        ttsFallback,
        pages,
        characters,
        lines,
        isAiPrefilled,
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
        loadAiDraft,
        setTranslation,
        removeTranslation,
        translationsForSave,
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
