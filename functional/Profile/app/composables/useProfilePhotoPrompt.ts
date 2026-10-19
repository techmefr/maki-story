export const useProfilePhotoPrompt = () => {
    const { t } = useI18n()
    const { current, homePath } = useCurrentMember()
    const { changePhoto } = useMembers()
    const isBusy = ref(false)
    const errorMessage = ref('')
    const hex = computed(() => memberHex(current.value))

    const save = async (blob: Blob): Promise<void> => {
        if (!current.value || isBusy.value) {
            return
        }
        isBusy.value = true
        errorMessage.value = ''
        try {
            await changePhoto(current.value.id, blob)
            await navigateTo(homePath.value)
        } catch (_error) {
            errorMessage.value = t('home.grimace.saveFailed')
        } finally {
            isBusy.value = false
        }
    }

    return { homePath, hex, isBusy, errorMessage, save }
}
