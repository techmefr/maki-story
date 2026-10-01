export const useCurrentMember = () => {
    const currentId = useState<string | null>('current-member-id', () => null)
    const { request } = useApi()
    const { getById } = useMembers()

    const current = computed(() => getById(currentId.value))
    const isChild = computed(() => current.value?.role === 'child')

    const select = async (id: string | null): Promise<void> => {
        await request('/auth/profile', { method: 'POST', body: { memberId: id } })
        currentId.value = id
    }

    const homePath = computed(() => (isChild.value ? '/kid' : '/home'))

    return { currentId, current, isChild, homePath, select }
}
