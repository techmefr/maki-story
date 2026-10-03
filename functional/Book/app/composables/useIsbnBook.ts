export type TIsbnPhase = 'search' | 'form' | 'done'

export const useIsbnBook = () => {
    const { request } = useApi()
    const { create } = useBooks()
    const { tags, ensureLoaded, setBookTags } = useTags()

    const phase = ref<TIsbnPhase>('search')
    const isbn = ref('')
    const title = ref('')
    const author = ref('')
    const subjects = ref<string[]>([])
    const coverUrl = ref<string | null>(null)
    const selectedTags = ref<string[]>([])
    const autoTags = ref<string[]>([])
    const isBusy = ref(false)
    const isMissing = ref(false)
    const hasFailed = ref(false)

    const search = async (): Promise<void> => {
        isBusy.value = true
        isMissing.value = false
        hasFailed.value = false
        try {
            await ensureLoaded()
            const found = await request<IIsbnBook>(`/books/isbn/${encodeURIComponent(isbn.value.trim())}`)
            title.value = found.title
            author.value = found.author
            subjects.value = found.subjects
            coverUrl.value = found.coverUrl
            autoTags.value = suggestTagSlugs(tags.value, found.subjects)
            selectedTags.value = [...autoTags.value]
            phase.value = 'form'
        } catch (error) {
            const code = (error as { statusCode?: number }).statusCode
            isMissing.value = code === 404
            hasFailed.value = code !== 404
        } finally {
            isBusy.value = false
        }
    }

    const fillByHand = (): void => {
        title.value = ''
        author.value = ''
        subjects.value = []
        coverUrl.value = null
        selectedTags.value = []
        autoTags.value = []
        isMissing.value = false
        phase.value = 'form'
    }

    const toggleTag = (slug: string): void => {
        selectedTags.value = selectedTags.value.includes(slug) ? selectedTags.value.filter(item => item !== slug) : [...selectedTags.value, slug]
    }

    const save = async (): Promise<void> => {
        isBusy.value = true
        hasFailed.value = false
        try {
            const created = await create({
                title: title.value,
                author: author.value,
                kind: 'multi',
                soloMemberId: null,
                type: 'wordless',
                isbn: isbn.value.trim() === '' ? undefined : isbn.value,
                coverUrl: coverUrl.value ?? undefined,
                imageDesc: '',
                pageFileIds: [],
                lines: [],
            })
            await setBookTags(created.id, { tags: selectedTags.value, autoTags: autoTags.value.filter(slug => selectedTags.value.includes(slug)) })
            phase.value = 'done'
        } catch (_error) {
            hasFailed.value = true
        } finally {
            isBusy.value = false
        }
    }

    const again = (): void => {
        isbn.value = ''
        phase.value = 'search'
    }

    return { phase, isbn, title, author, subjects, coverUrl, tags, selectedTags, autoTags, isBusy, isMissing, hasFailed, search, fillByHand, toggleTag, save, again }
}
