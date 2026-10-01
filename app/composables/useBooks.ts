export const useBooks = () => {
    const { request } = useApi()
    const books = useState<IBookSummary[]>('books', () => [])

    const buildPath = (query: IBookQuery): string => {
        const params = new URLSearchParams()
        Object.entries(query).forEach(([key, value]) => {
            if (value !== undefined && value !== '') {
                params.set(key, String(value))
            }
        })
        const text = params.toString()
        return text ? `/books?${text}` : '/books'
    }

    const load = async (query: IBookQuery = {}): Promise<void> => {
        try {
            books.value = await request<IBookSummary[]>(buildPath(query))
        } catch (error) {
            console.error('Impossible de charger la bibliotheque pour le moment', error)
        }
    }

    const get = (id: string): Promise<IBook> => request<IBook>(`/books/${id}`)

    const create = (input: INewBook): Promise<{ id: string }> => {
        return request<{ id: string }>('/books', { method: 'POST', body: input })
    }

    const patch = (id: string, body: IBookPatch): Promise<IBook> => {
        return request<IBook>(`/books/${id}`, { method: 'PATCH', body })
    }

    const remove = async (id: string): Promise<void> => {
        await request(`/books/${id}`, { method: 'DELETE' })
        books.value = books.value.filter(book => book.id !== id)
    }

    const setLineAudio = async (bookId: string, lineId: string, fileId: string, ms: number, language?: string): Promise<void> => {
        await request(`/books/${bookId}/lines/${lineId}/audio`, { method: 'PUT', body: { fileId, ms, language } })
    }

    const clearLineAudio = async (bookId: string, lineId: string, language?: string): Promise<void> => {
        const query = language ? `?language=${encodeURIComponent(language)}` : ''
        await request(`/books/${bookId}/lines/${lineId}/audio${query}`, { method: 'DELETE' })
    }

    const setTranslation = (bookId: string, lineId: string, language: string, body: ITranslationBody): Promise<ILineTranslation> => {
        return request<ILineTranslation>(`/books/${bookId}/lines/${lineId}/translations/${language}`, { method: 'PUT', body })
    }

    const readyBooks = computed(() => books.value.filter(book => book.status === 'ready'))

    return { books, readyBooks, load, get, create, patch, remove, setLineAudio, clearLineAudio, setTranslation }
}
