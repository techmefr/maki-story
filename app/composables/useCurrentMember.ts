const STORAGE_KEY = 'tantara-current-member'

export const useCurrentMember = () => {
    const currentId = useState<string | null>('current-member-id', () => {
        try {
            return localStorage.getItem(STORAGE_KEY)
        } catch (_error) {
            return null
        }
    })
    const { getById } = useMembers()

    const current = computed(() => getById(currentId.value))
    const isChild = computed(() => current.value?.role === 'child')

    const select = (id: string | null): void => {
        currentId.value = id
        try {
            if (id) {
                localStorage.setItem(STORAGE_KEY, id)
            } else {
                localStorage.removeItem(STORAGE_KEY)
            }
        } catch (_error) {
            console.warn('Le profil choisi ne pourra pas etre retenu sur cet appareil')
        }
    }

    const homePath = computed(() => (isChild.value ? '/kid' : '/home'))

    return { currentId, current, isChild, homePath, select }
}
