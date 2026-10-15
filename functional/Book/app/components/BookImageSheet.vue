<template>
    <AppBottomSheet :open="open" :title="t('bookCreate.flow.sheetTitle')" @close="emit('close')">
        <div class="stack">
            <AppButton as="label" is-block icon="camera" data-testid="image-take">
                {{ t('bookCreate.flow.takePhoto') }}
                <input type="file" accept="image/*" capture="environment" hidden data-testid="image-input-camera" @change="onPick" />
            </AppButton>
            <AppButton as="label" is-block variant="secondary" icon="book" data-testid="image-gallery">
                {{ t('bookCreate.flow.pickGallery') }}
                <input type="file" accept="image/*" hidden data-testid="image-input-gallery" @change="onPick" />
            </AppButton>
            <p v-if="isBusy" class="muted" role="status">{{ t('bookDraft.pages.sending') }}</p>
            <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
            <AppButton variant="secondary" is-block @click="emit('close')">{{ t('common.cancel') }}</AppButton>
        </div>
    </AppBottomSheet>
</template>

<script setup lang="ts">
defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: []; picked: [image: { fileId: string; previewUrl: string }] }>()

const { t } = useI18n()
const { upload } = useFiles()

const isBusy = ref(false)
const errorMessage = ref('')

const onPick = async (event: Event): Promise<void> => {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    input.value = ''
    if (!file) {
        return
    }
    isBusy.value = true
    errorMessage.value = ''
    try {
        const blob = await compressImage(file)
        const fileId = await upload(blob, blob.type)
        emit('picked', { fileId, previewUrl: URL.createObjectURL(blob) })
        emit('close')
    } catch (error) {
        console.error('Une photo n a pas pu être envoyée', error)
        errorMessage.value = t('bookDraft.pages.photoFailed')
    } finally {
        isBusy.value = false
    }
}
</script>
