export const useFamilies = () => {
    const { request } = useApi()
    const { switchFamily } = useSession()
    const overview = useState<IAccountOverview | null>('account-overview', () => null)
    const isBusy = ref(false)
    const hasFailed = ref(false)

    const memberships = computed<IMembership[]>(() => (overview.value?.memberships ?? []).filter(item => item.status === 'ACTIVE'))
    const isLoaded = computed<boolean>(() => overview.value !== null)

    const load = async (): Promise<void> => {
        try {
            overview.value = await request<IAccountOverview>('/auth/memberships')
        } catch (_error) {
            hasFailed.value = true
        }
    }

    const choose = async (familyId: string): Promise<void> => {
        isBusy.value = true
        hasFailed.value = false
        try {
            await switchFamily(familyId)
            await navigateTo('/profiles')
        } catch (_error) {
            hasFailed.value = true
        } finally {
            isBusy.value = false
        }
    }

    return { memberships, isLoaded, isBusy, hasFailed, load, choose }
}
