export const useRelativeProfile = (memberId: string) => {
    const { request } = useApi()
    const { remove, removeCode, load } = useMembers()

    const overview = ref<IRelativeOverview | null>(null)
    const message = ref('')
    const hasFailed = ref(false)
    const isBusy = ref(false)

    const guard = async (action: () => Promise<void>): Promise<boolean> => {
        isBusy.value = true
        hasFailed.value = false
        message.value = ''
        try {
            await action()
            return true
        } catch (_error) {
            hasFailed.value = true
            return false
        } finally {
            isBusy.value = false
        }
    }

    const loadOverview = async (): Promise<void> => {
        await guard(async () => {
            overview.value = await request<IRelativeOverview>(`/relatives/${memberId}`)
        })
    }

    const resetCode = (): Promise<boolean> => guard(() => removeCode(memberId))

    const changeRole = (role: InvitationRole): Promise<boolean> =>
        guard(async () => {
            await request(`/relatives/${memberId}/role`, { method: 'PUT', body: { role } })
            await load()
        })

    const removeFromFamily = (): Promise<boolean> => guard(() => remove(memberId))

    return { overview, message, hasFailed, isBusy, loadOverview, resetCode, changeRole, removeFromFamily }
}
