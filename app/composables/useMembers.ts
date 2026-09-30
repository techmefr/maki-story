export const useMembers = () => {
    const { request } = useApi()
    const members = useState<IMember[]>('members', () => [])
    const isLoaded = useState<boolean>('members-loaded', () => false)
    const { preload } = useMemberPhotos()

    const load = async (): Promise<void> => {
        try {
            members.value = await request<IMember[]>('/members')
            isLoaded.value = true
            await preload(members.value)
        } catch (error) {
            console.error('Impossible de charger la famille pour le moment', error)
        }
    }

    const ensureLoaded = async (): Promise<void> => {
        if (!isLoaded.value) {
            await load()
        }
    }

    const getById = (id: string | null): IMember | null => {
        return members.value.find(member => member.id === id) ?? null
    }

    const add = async (input: IMemberInput): Promise<IMember> => {
        const member = await request<IMember>('/members', { method: 'POST', body: input })
        members.value = [...members.value, member]
        return member
    }

    const update = async (id: string, patch: Partial<IMember>): Promise<void> => {
        const member = await request<IMember>(`/members/${id}`, { method: 'PATCH', body: patch })
        members.value = members.value.map(item => (item.id === id ? member : item))
        await preload(members.value)
    }

    const remove = async (id: string): Promise<void> => {
        await request(`/members/${id}`, { method: 'DELETE' })
        members.value = members.value.filter(member => member.id !== id)
    }

    const children = computed(() => members.value.filter(member => member.role === 'child'))
    const grownUps = computed(() => members.value.filter(member => member.role !== 'child'))

    return { members, children, grownUps, load, ensureLoaded, getById, add, update, remove }
}
