<template>
    <div class="stack">
        <p class="muted">
            {{ t('bookDraft.pages.intro') }}
        </p>
        <AppButton as="label" is-block>
            {{ pages.length === 0 ? t('bookDraft.pages.takePhoto') : t('bookDraft.pages.addPage') }}
            <input type="file" accept="image/*" capture="environment" multiple hidden @change="addPhotos" />
        </AppButton>
        <AppButton variant="secondary" is-block v-if="!isWordless" @click="addEmptyPage">{{ t('bookDraft.pages.addEmpty') }}</AppButton>
        <div v-if="isBusy" class="muted" role="status">{{ t('bookDraft.pages.sending') }}</div>
        <div v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</div>
        <div v-for="(page, index) in pages" :key="page.key" class="card stack" :aria-label="t('bookDraft.shared.page', { n: index + 1 })" role="group">
            <div class="row" style="justify-content: space-between">
                <span class="subtitle">{{ t('bookDraft.shared.page', { n: index + 1 }) }}</span>
                <span v-if="page.kind === 'cover'" class="badge">{{ t('bookDraft.shared.cover') }}</span>
                <span v-else-if="page.kind === 'empty'" class="badge">{{ t('bookDraft.shared.emptyPage') }}</span>
                <AppButton variant="secondary" size="sm" :aria-label="t('bookDraft.pages.removePage', { n: index + 1 })" @click="removePage(index)">×</AppButton>
            </div>
            <div v-if="page.previewUrl" class="thumb" :style="{ backgroundImage: `url(${page.previewUrl})` }" />
            <template v-if="page.kind === 'empty'">
                <p class="muted">{{ t('bookDraft.pages.emptyNote') }}</p>
                <AppCheckbox :model-value="page.ttsFallback" @update:model-value="updatePage(index, { ttsFallback: Boolean($event) })">{{ t('bookDraft.pages.ttsFallback') }}</AppCheckbox>
            </template>
            <template v-else>
                <button type="button" class="chip" :class="{ 'chip--on': page.kind === 'cover' }" :aria-pressed="page.kind === 'cover'" @click="toggleCover(index)">
                    {{ t('bookDraft.shared.cover') }}
                </button>
                <label class="stack" style="gap: 6px">
                    <span class="label">{{ t('bookDraft.pages.describe') }}</span>
                    <input
                        class="input"
                        :value="page.description"
                        :placeholder="t('bookDraft.pages.describePlaceholder')"
                        @input="updatePage(index, { description: ($event.target as HTMLInputElement).value })"
                    />
                </label>
                <div v-if="isComic" class="stack">
                    <div v-for="(panel, panelIndex) in page.panels" :key="panel.key" class="row">
                        <label class="stack grow" style="gap: 4px">
                            <span class="label">{{ t('bookDraft.shared.panel', { n: panelIndex + 1 }) }}</span>
                            <input
                                class="input"
                                :value="panel.description"
                                :placeholder="t('bookDraft.pages.panelPlaceholder')"
                                @input="updatePanel(index, panelIndex, ($event.target as HTMLInputElement).value)"
                            />
                        </label>
                        <AppButton variant="secondary" size="sm"
                            :aria-label="t('bookDraft.pages.removePanel', { panel: panelIndex + 1, page: index + 1 })"
                            @click="removePanel(index, panelIndex)">
                            ×
                        </AppButton>
                    </div>
                    <AppButton variant="secondary" size="sm" @click="addPanel(index)">{{ t('bookDraft.pages.addPanel') }}</AppButton>
                </div>
            </template>
        </div>
        <div v-if="needsPhoto" class="muted">{{ t('bookDraft.pages.needsPhoto') }}</div>
        <AppButton is-block :disabled="isBusy || needsPhoto" @click="emit('next')">
            {{ pages.length === 0 && !needsPhoto ? t('bookDraft.pages.continueNoPhoto') : t('common.next') }}
        </AppButton>
    </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{ next: [] }>()

const { t } = useI18n()
const { pages, isComic, isWordless, addPhoto, addEmptyPage, updatePage, removePage, addPanel, updatePanel, removePanel } = useBookDraft()
const { upload } = useFiles()

const isBusy = ref(false)
const errorMessage = ref('')

const hasPhoto = computed(() => pages.value.some(page => page.fileId !== null))
const needsPhoto = computed(() => (isComic.value || isWordless.value) && !hasPhoto.value)

const addPhotos = async (event: Event): Promise<void> => {
    const input = event.target as HTMLInputElement
    const files = Array.from(input.files ?? [])
    input.value = ''
    isBusy.value = true
    errorMessage.value = ''
    try {
        for (const file of files) {
            const blob = await compressImage(file)
            const fileId = await upload(blob, blob.type)
            addPhoto(fileId, URL.createObjectURL(blob))
        }
    } catch (error) {
        console.error('Une photo n a pas pu être envoyée', error)
        errorMessage.value = t('bookDraft.pages.photoFailed')
    } finally {
        isBusy.value = false
    }
}

const toggleCover = (index: number): void => {
    const isCover = pages.value[index]?.kind === 'cover'
    pages.value.forEach((page, position) => {
        if (page.kind === 'empty') {
            return
        }
        updatePage(position, { kind: position === index && !isCover ? 'cover' : 'content' })
    })
}
</script>

<style scoped>
.thumb {
    aspect-ratio: 4 / 3;
    max-height: 180px;
    width: 100%;
    border: 2.5px solid var(--ink);
    border-radius: 12px;
    background-size: cover;
    background-position: center;
}

</style>
