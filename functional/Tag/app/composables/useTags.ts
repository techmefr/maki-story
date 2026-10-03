export const useTags = () => {
    const { request } = useApi()
    const tags = useState<ITag[]>('tags', () => [])
    const isLoaded = useState<boolean>('tags-loaded', () => false)
    const { languages, ensureLoaded: ensureMembers } = useFamilyLanguages()
    const { labelOf } = useTagLabel()

    const load = async (): Promise<void> => {
        tags.value = await request<ITag[]>('/tags')
        isLoaded.value = true
    }

    const ensureLoaded = async (): Promise<void> => {
        await ensureMembers()
        if (!isLoaded.value) {
            await load()
        }
    }

    const bySlug = (slug: string): ITag | null => tags.value.find(tag => tag.slug === slug) ?? null

    const missingCount = (tag: ITag): number => missingTagLanguages(tag, languages.value).length

    const create = async (input: ITagInput): Promise<void> => {
        await request<{ slug: string }>('/tags', { method: 'POST', body: input })
        await load()
    }

    const update = async (slug: string, input: ITagInput): Promise<void> => {
        await request<{ slug: string }>(`/tags/${encodeURIComponent(slug)}`, { method: 'PATCH', body: input })
        await load()
    }

    const remove = async (slug: string): Promise<void> => {
        await request(`/tags/${encodeURIComponent(slug)}`, { method: 'DELETE' })
        await load()
    }

    const setBookTags = async (bookId: string, body: IBookTagsBody): Promise<void> => {
        await request(`/books/${bookId}/tags`, { method: 'PUT', body })
    }

    const hexOf = (tag: ITag): string => getVoiceColor(tag.color).hex

    return { tags, languages, isLoaded, load, ensureLoaded, bySlug, labelOf, missingCount, create, update, remove, setBookTags, hexOf }
}
