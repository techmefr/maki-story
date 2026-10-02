<template>
    <div class="stack center narrow">
        <h1 class="title">{{ t('home.grimace.title') }}</h1>
        <p class="muted">{{ t('home.grimace.help') }}</p>
        <PhotoCapture :frame-color="hex" @captured="onCaptured" />
        <AppButton variant="secondary" size="sm" :to="homePath">{{ t('home.grimace.later') }}</AppButton>
        <div v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</div>
    </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const { current, homePath } = useCurrentMember()
const { update } = useMembers()
const { upload } = useFiles()
const { register } = useMemberPhotos()

const errorMessage = ref('')
const hex = computed(() => memberHex(current.value))

const onCaptured = async (blob: Blob): Promise<void> => {
    if (!current.value) {
        return
    }
    try {
        const fileId = await upload(blob, blob.type)
        register(fileId, URL.createObjectURL(blob))
        await update(current.value.id, { photoFileId: fileId })
        await navigateTo(homePath.value)
    } catch (error) {
        console.error('La grimace n a pas pu être enregistrée', error)
        errorMessage.value = t('home.grimace.saveFailed')
    }
}
</script>
