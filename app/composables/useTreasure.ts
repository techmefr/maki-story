export const useTreasure = () => {
    const { request } = useApi()
    const items = useState<ITreasure[]>('treasure-items', () => [])
    const limit = useState<number>('treasure-limit', () => TREASURE_LIMIT)
    const loadedFor = useState<string | null>('treasure-loaded-for', () => null)

    const count = computed(() => items.value.length)
    const isFull = computed(() => items.value.length >= limit.value)

    const load = async (childId?: string): Promise<void> => {
        const query = childId ? `?childId=${encodeURIComponent(childId)}` : ''
        try {
            const box = await request<ITreasureBox>(`/treasure${query}`)
            items.value = box.items
            limit.value = box.limit
            loadedFor.value = childId ?? null
        } catch (error) {
            console.error('Le trésor n a pas pu être chargé', error)
        }
    }

    const save = async (messageId: string): Promise<ITreasure> => {
        const saved = await request<ITreasure>('/treasure', { method: 'POST', body: { messageId } })
        if (!items.value.some(item => item.id === saved.id)) {
            items.value = [saved, ...items.value]
        }
        return saved
    }

    const remove = async (id: string): Promise<void> => {
        await request(`/treasure/${id}`, { method: 'DELETE' })
        items.value = items.value.filter(item => item.id !== id)
    }

    const hasMessage = (messageId: string): boolean => items.value.some(item => item.sourceMessageId === messageId)

    return { items, limit, count, isFull, load, save, remove, hasMessage }
}
