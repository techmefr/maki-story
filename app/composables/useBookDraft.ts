export interface IDraftLine {
    key: number
    pageIndex: number
    character: string
    text: string
    note: string
    memberId: string | null
}

export interface IDraftPage {
    fileId: string
    previewUrl: string
}

export type DraftStep = 'scan' | 'lines' | 'colors' | 'review'

let nextLineKey = 1

export const useBookDraft = () => {
    const step = useState<DraftStep>('draft-step', () => 'scan')
    const kind = useState<BookKind>('draft-kind', () => 'multi')
    const soloMemberId = useState<string | null>('draft-solo', () => null)
    const pages = useState<IDraftPage[]>('draft-pages', () => [])
    const lines = useState<IDraftLine[]>('draft-lines', () => [])
    const imageDesc = useState<string>('draft-image-desc', () => '')
    const tones = useState<Record<string, string>>('draft-tones', () => ({}))
    const title = useState<string>('draft-title', () => '')
    const isByLine = useState<boolean>('draft-by-line', () => false)

    const pageCount = computed(() => Math.max(1, pages.value.length))
    const characters = computed(() => [...new Set(lines.value.map(line => line.character).filter(name => name !== ''))])
    const hasLines = computed(() => lines.value.length > 0)
    const isSolo = computed(() => kind.value === 'solo')
    const isFullyCast = computed(() => lines.value.every(line => line.memberId !== null))
    const uncastCount = computed(() => lines.value.filter(line => line.memberId === null).length)
    const castMemberIds = computed(() => [...new Set(lines.value.map(line => line.memberId).filter((id): id is string => id !== null))])

    const reset = (nextKind: BookKind, readerId: string | null): void => {
        step.value = 'scan'
        kind.value = nextKind
        soloMemberId.value = nextKind === 'solo' ? readerId : null
        pages.value = []
        lines.value = []
        imageDesc.value = ''
        tones.value = {}
        title.value = ''
        isByLine.value = false
    }

    const addLine = (pageIndex: number, character: string, text: string): void => {
        lines.value = [
            ...lines.value,
            {
                key: nextLineKey++,
                pageIndex,
                character: character.trim(),
                text: text.trim(),
                note: '',
                memberId: kind.value === 'solo' ? soloMemberId.value : null,
            },
        ]
    }

    const removeLine = (key: number): void => {
        lines.value = lines.value.filter(line => line.key !== key)
    }

    const linesOfPage = (pageIndex: number): IDraftLine[] => {
        return lines.value.filter(line => line.pageIndex === pageIndex)
    }

    const castCharacter = (character: string, memberId: string): void => {
        lines.value = lines.value.map(line => (line.character === character ? { ...line, memberId } : line))
    }

    const castLine = (key: number, memberId: string): void => {
        lines.value = lines.value.map(line => (line.key === key ? { ...line, memberId } : line))
    }

    const setNote = (key: number, note: string): void => {
        lines.value = lines.value.map(line => (line.key === key ? { ...line, note } : line))
    }

    const memberOfCharacter = (character: string): string | null => {
        return lines.value.find(line => line.character === character)?.memberId ?? null
    }

    return {
        step,
        kind,
        soloMemberId,
        pages,
        lines,
        imageDesc,
        tones,
        title,
        isByLine,
        pageCount,
        characters,
        hasLines,
        isSolo,
        isFullyCast,
        uncastCount,
        castMemberIds,
        reset,
        addLine,
        removeLine,
        linesOfPage,
        castCharacter,
        castLine,
        setNote,
        memberOfCharacter,
    }
}
