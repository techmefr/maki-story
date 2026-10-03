export const useCurrentMember = () => {
    const currentId = useState<string | null>('current-member-id', () => null)
    const { request } = useApi()
    const { getById } = useMembers()

    const current = computed(() => getById(currentId.value))
    const isChild = computed(() => current.value?.role === 'child')
    const isParent = computed(() => current.value?.role === 'parent')

    const select = async (id: string | null, proof: IProfileProof = {}): Promise<void> => {
        await request('/auth/profile', { method: 'POST', body: { memberId: id, ...proof } })
        currentId.value = id
        if (id === null) {
            markProfileLocked()
        } else {
            markProfileUnlocked()
        }
    }

    const lock = (): Promise<void> => select(null)

    const homePath = computed(() => (isChild.value ? '/kid' : '/home'))

    return { currentId, current, isChild, isParent, homePath, select, lock }
}
