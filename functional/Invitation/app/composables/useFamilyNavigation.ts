export const useFamilyNavigation = () => {
    const { switchFamily } = useSession()
    const { flow } = useRelativeFlow()
    const { t } = useI18n()
    const isOpening = ref(false)
    const navigationError = ref('')

    const openFamily = async (familyId: string, path: string): Promise<void> => {
        if (isOpening.value) {
            return
        }
        isOpening.value = true
        navigationError.value = ''
        try {
            if (flow.value.currentFamilyId !== familyId) {
                await switchFamily(familyId)
                flow.value.currentFamilyId = familyId
            }
            await navigateTo(path)
        } catch (error) {
            console.error('Impossible d’ouvrir la famille', error)
            navigationError.value = t('relative.openFailed')
        } finally {
            isOpening.value = false
        }
    }

    return { isOpening, navigationError, openFamily }
}
