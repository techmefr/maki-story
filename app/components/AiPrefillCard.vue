<template>
    <section class="card stack" aria-labelledby="ai-prefill-title">
        <h2 id="ai-prefill-title" class="subtitle"><AppIcon name="sparkles" :size="22" />{{ t('ai.prefill.title') }}</h2>
        <p class="muted">
            {{ t('ai.prefill.intro') }}
        </p>
        <label class="btn btn--block" :class="{ 'btn--disabled': isBlocked }" :aria-disabled="isBlocked">
            {{ isBusy ? t('ai.prefill.reading') : t('ai.prefill.choose') }}
            <input type="file" accept="image/*" capture="environment" multiple hidden :disabled="isBlocked" data-testid="ai-prefill-input" @change="prefill" />
        </label>
        <p v-if="isBusy" class="muted" role="status">{{ progressLabel }}</p>
        <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
        <AiQuota />
    </section>
</template>

<script setup lang="ts">
const MAX_PHOTOS = 4

const { t } = useI18n()
const { language, pages, addPhoto, loadAiDraft } = useBookDraft()
const { upload } = useFiles()
const { prefillFromPhotos, refreshStatus, isExhausted, isUnavailable } = useAi()

const isBusy = ref(false)
const errorMessage = ref('')
const progressLabel = ref('')

const isBlocked = computed(() => isBusy.value || isExhausted.value || isUnavailable.value)

const prefill = async (event: Event): Promise<void> => {
    const input = event.target as HTMLInputElement
    const files = Array.from(input.files ?? []).slice(0, MAX_PHOTOS)
    input.value = ''
    if (files.length === 0) {
        return
    }
    isBusy.value = true
    errorMessage.value = ''
    try {
        const photos: { fileId: string; previewUrl: string }[] = []
        for (const [index, file] of files.entries()) {
            progressLabel.value = t('ai.prefill.uploading', { n: index + 1, total: files.length })
            const blob = await compressImage(file)
            photos.push({ fileId: await upload(blob, 'image/jpeg'), previewUrl: URL.createObjectURL(blob) })
        }
        progressLabel.value = t('ai.prefill.aiReading')
        const result = await prefillFromPhotos({ fileIds: photos.map(photo => photo.fileId), language: language.value })
        pages.value = []
        photos.forEach(photo => addPhoto(photo.fileId, photo.previewUrl))
        loadAiDraft(result.draft)
    } catch (error) {
        console.error('Le pré-remplissage n a pas abouti', error)
        errorMessage.value = t(aiErrorKey(error))
    } finally {
        isBusy.value = false
        await refreshStatus()
    }
}

onMounted(refreshStatus)
</script>

<style scoped>
.btn--disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
</style>
