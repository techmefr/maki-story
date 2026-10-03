export const useBookAccess = () => {
    const { request } = useApi()
    const { children, load: loadMembers } = useMembers()
    const { books, load: loadBooks } = useBooks()

    const selectedId = ref<string | null>(null)
    const access = ref<Record<string, IBookAccess>>({})
    const hasFailed = ref(false)

    const readyBooks = computed<IBookSummary[]>(() => books.value.filter(book => book.status === 'ready'))
    const current = computed<IBookAccess | null>(() => (selectedId.value ? (access.value[selectedId.value] ?? null) : null))

    const select = async (id: string): Promise<void> => {
        selectedId.value = id
        if (access.value[id]) {
            return
        }
        try {
            access.value = { ...access.value, [id]: await request<IBookAccess>(`/members/${id}/book-access`) }
        } catch (_error) {
            hasFailed.value = true
        }
    }

    const persist = async (next: IBookAccess): Promise<void> => {
        const id = selectedId.value
        if (!id) {
            return
        }
        hasFailed.value = false
        try {
            access.value = { ...access.value, [id]: await request<IBookAccess>(`/members/${id}/book-access`, { method: 'PUT', body: next }) }
        } catch (_error) {
            hasFailed.value = true
        }
    }

    const toggleAll = async (): Promise<void> => {
        const value = current.value
        if (value) {
            await persist({ isRestricted: !value.isRestricted, bookIds: value.isRestricted ? [] : readyBooks.value.map(book => book.id) })
        }
    }

    const toggleBook = async (bookId: string): Promise<void> => {
        const value = current.value
        if (!value || !value.isRestricted) {
            return
        }
        const bookIds = value.bookIds.includes(bookId) ? value.bookIds.filter(item => item !== bookId) : [...value.bookIds, bookId]
        await persist({ isRestricted: true, bookIds })
    }

    const init = async (): Promise<void> => {
        await Promise.all([loadMembers(), loadBooks()])
        const first = children.value[0]
        if (first) {
            await select(first.id)
        }
    }

    return { children, readyBooks, selectedId, current, hasFailed, init, select, toggleAll, toggleBook }
}
