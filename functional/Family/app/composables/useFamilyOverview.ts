export interface IFamilyGroup {
    role: MemberRole
    members: IMember[]
}

const GROUP_ORDER: MemberRole[] = ['parent', 'child', 'relative']

export const PROVIDER_LABELS: Record<ToggleableProviderId, string> = { apple: 'Apple', microsoft: 'Microsoft', facebook: 'Facebook' }

export const useFamilyOverview = () => {
    const { request } = useApi()
    const { people, load, remove } = useMembers()
    const { currentId } = useCurrentMember()

    const providers = ref<Record<ToggleableProviderId, boolean> | null>(null)
    const pending = ref<IMember | null>(null)
    const hasFailed = ref(false)
    const isBusy = ref(false)

    const groups = computed<IFamilyGroup[]>(() =>
        GROUP_ORDER.map(role => ({ role, members: people.value.filter(member => member.role === role && member.status !== 'left') })).filter(group => group.members.length > 0),
    )

    const parentCount = computed<number>(() => people.value.filter(member => member.role === 'parent' && member.status !== 'left').length)

    const isRemovable = (member: IMember): boolean => {
        if (member.id === currentId.value) {
            return false
        }
        return member.role !== 'parent' || parentCount.value > 1
    }

    const loadProviders = async (): Promise<void> => {
        try {
            providers.value = await request<Record<ToggleableProviderId, boolean>>('/family/providers')
        } catch (_error) {
            hasFailed.value = true
        }
    }

    const toggleProvider = async (provider: ToggleableProviderId, isEnabled: boolean): Promise<void> => {
        hasFailed.value = false
        try {
            providers.value = await request<Record<ToggleableProviderId, boolean>>('/family/providers', { method: 'PUT', body: { provider, isEnabled } })
        } catch (_error) {
            hasFailed.value = true
        }
    }

    const confirmRemoval = async (): Promise<void> => {
        const target = pending.value
        if (!target) {
            return
        }
        isBusy.value = true
        hasFailed.value = false
        try {
            await remove(target.id)
            pending.value = null
        } catch (_error) {
            hasFailed.value = true
        } finally {
            isBusy.value = false
        }
    }

    const init = async (): Promise<void> => {
        await Promise.all([load(), loadProviders()])
    }

    return { groups, providers, pending, hasFailed, isBusy, isRemovable, toggleProvider, confirmRemoval, init }
}
