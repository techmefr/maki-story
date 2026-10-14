<template>
    <section class="stack" role="group" :aria-label="t('bookCreate.flow.pageTitle', { n: cursor + 1 })" data-testid="page-step" :data-page="cursor + 1">
        <div class="row page__head">
            <AppButton variant="secondary" size="sm" icon="back" data-testid="page-back" @click="emit('back')">{{ backLabel }}</AppButton>
            <span class="badge">{{ t('bookCreate.flow.stepLabel', { n: cursor + 2 }) }}</span>
        </div>
        <h2 class="title page__title">{{ t('bookCreate.flow.pageTitle', { n: cursor + 1 }) }}</h2>

        <section v-if="previousPages.length > 0" class="stack" :aria-label="t('bookCreate.flow.previousPages')">
            <button v-for="row in previousPages" :key="row.index" type="button" class="page__row" :data-testid="`page-row-${row.index + 1}`" @click="cursor = row.index">
                <span class="subtitle">{{ t('bookCreate.flow.pageTitle', { n: row.index + 1 }) }}</span>
                <span class="muted">{{ row.meta }}</span>
            </button>
        </section>

        <section v-if="page" class="stack" role="group" :aria-label="t('bookCreate.flow.imageLabel')">
            <h3 class="subtitle">{{ t('bookCreate.flow.imageLabel') }}</h3>
            <div class="row">
                <AppChip class="grow" :selected="page.fileId === null" data-testid="page-blank" @click="setBlank">{{ t('bookCreate.flow.blankPage') }}</AppChip>
                <AppChip class="grow" :selected="page.fileId !== null || isPhotoMode" data-testid="page-photo" @click="isPhotoMode = true">{{ t('bookCreate.flow.withPhoto') }}</AppChip>
            </div>
            <button v-if="page.fileId !== null || isPhotoMode" type="button" class="cover__tile" :class="{ 'cover__tile--on': page.previewUrl !== '' }" :style="page.previewUrl !== '' ? { backgroundImage: `url(${page.previewUrl})` } : undefined" data-testid="page-add-image" @click="isSheetOpen = true">
                <span v-if="page.previewUrl === ''" class="cover__plus" aria-hidden="true">+</span>
                <span class="cover__label">{{ page.previewUrl === '' ? t('bookCreate.flow.image') : t('bookCreate.flow.photoAdded') }}</span>
            </button>
        </section>

        <section v-if="page && isComic" class="stack" :aria-label="t('bookCreate.flow.panels')">
            <h3 class="subtitle">{{ t('bookCreate.flow.panels') }}</h3>
            <div v-for="(panel, panelIndex) in page.panels" :key="panel.key" class="card stack">
                <div class="row">
                    <label class="stack grow" style="gap: 4px">
                        <span class="label">{{ t('bookDraft.shared.panel', { n: panelIndex + 1 }) }}</span>
                        <input class="input" :value="panel.description" :placeholder="t('bookDraft.pages.panelPlaceholder')" @input="updatePanel(cursor, panelIndex, ($event.target as HTMLInputElement).value)" />
                    </label>
                    <AppButton variant="secondary" size="sm" :aria-label="t('bookDraft.pages.removePanel', { panel: panelIndex + 1, page: cursor + 1 })" @click="removePanel(cursor, panelIndex)">×</AppButton>
                </div>
                <AppCheckbox :model-value="panel.isSilent === true" @update:model-value="setPanelSilent(cursor, panelIndex, Boolean($event))">{{ t('bookDraft.pages.silentPanel') }}</AppCheckbox>
            </div>
            <AppButton variant="secondary" is-block icon="plus" data-testid="panel-add" @click="addPanel(cursor)">{{ t('bookDraft.pages.addPanel') }}</AppButton>
        </section>

        <section v-if="page && !isWordless" class="stack" role="group" :aria-label="t('bookCreate.flow.voiceLabel')">
            <h3 class="subtitle">{{ t('bookCreate.flow.voiceLabel') }}</h3>
            <div class="row">
                <AppChip class="grow" :selected="!isSilent" :data-testid="`page-voice-${cursor + 1}`" @click="setSilent(false)">{{ t('bookCreate.flow.withVoice') }}</AppChip>
                <AppChip class="grow" :selected="isSilent" :data-testid="`page-silent-${cursor + 1}`" @click="setSilent(true)">{{ t('bookCreate.flow.noVoice') }}</AppChip>
            </div>
            <p v-if="isSilent" class="muted" role="note">{{ t('bookCreate.flow.silentNote') }}</p>
        </section>
        <p v-else-if="isWordless" class="muted" role="note">{{ t('bookCreate.flow.wordlessNote') }}</p>

        <template v-if="page && !isSilent && !isWordless">
            <BookVoiceForm v-for="(line, index) in pageVoices" :key="line.key" :line="line" :number="index + 1" :panels="page.panels.length" />
            <AppButton variant="secondary" is-block icon="plus" data-testid="voice-add" @click="addVoice(cursor)">{{ t('bookCreate.flow.addVoice') }}</AppButton>
        </template>

        <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
        <p v-if="saveNotice" class="muted" role="status">{{ saveNotice }}</p>

        <AppButton is-block data-testid="page-next" @click="onNext">{{ t('bookCreate.flow.nextPageButton') }}</AppButton>
        <AppButton variant="secondary" is-block data-testid="pages-finish" @click="onFinish">{{ t('bookCreate.flow.finish') }}</AppButton>
        <AppButton variant="secondary" is-block data-testid="save-draft" @click="onSave">{{ t('bookCreate.flow.saveDraft') }}</AppButton>

        <BookImageSheet :open="isSheetOpen" @close="isSheetOpen = false" @picked="onPicked" />
    </section>
</template>

<script setup lang="ts">
const emit = defineEmits<{ back: []; finish: [] }>()

const { t } = useI18n()
const { pages, lines, cursor, isWordless, isComic, updatePage, addEmptyPage, addVoice, syncDraft, addPanel, updatePanel, setPanelSilent, removePanel } = useBookDraft()

const isSheetOpen = ref(false)
const isPhotoMode = ref(false)
const errorMessage = ref('')
const saveNotice = ref('')

const page = computed(() => pages.value[cursor.value] ?? null)
const isSilent = computed(() => page.value?.isSilent === true)
const pageVoices = computed(() => lines.value.filter(line => line.pageIndex === cursor.value))
const backLabel = computed(() => (cursor.value === 0 ? t('bookCreate.flow.backCover') : t('bookCreate.flow.backPage', { n: cursor.value })))

const metaOf = (index: number): string => {
    const target = pages.value[index]
    if (target?.isSilent === true || isWordless.value) {
        return t('bookCreate.flow.silentShort')
    }
    return t('bookCreate.flow.voiceCount', { count: lines.value.filter(line => line.pageIndex === index && line.text.trim() !== '').length })
}

const previousPages = computed(() => pages.value.flatMap((_page, index) => (index === cursor.value ? [] : [{ index, meta: metaOf(index) }])))

const ensurePage = (): void => {
    if (pages.value.length === 0) {
        addEmptyPage()
        updatePage(0, { kind: 'content', isSilent: isWordless.value, ttsFallback: false })
    }
}

const setBlank = (): void => {
    isPhotoMode.value = false
    pages.value = pages.value.map((item, index) => (index === cursor.value ? { ...item, fileId: null, previewUrl: '' } : item))
}

const setSilent = (value: boolean): void => {
    updatePage(cursor.value, { isSilent: value })
    if (!value && pageVoices.value.length === 0) {
        addVoice(cursor.value)
    }
}

const onPicked = (image: { fileId: string; previewUrl: string }): void => {
    pages.value = pages.value.map((item, index) => (index === cursor.value ? { ...item, fileId: image.fileId, previewUrl: image.previewUrl } : item))
    isPhotoMode.value = true
}

const problem = (): string => {
    if (isSilent.value || isWordless.value) {
        return ''
    }
    const empty = pageVoices.value.some(line => line.text.trim() === '')
    return empty ? t('bookCreate.flow.errVoiceText') : ''
}

const onSave = async (): Promise<void> => {
    saveNotice.value = (await syncDraft()) ? t('bookCreate.flow.draftSaved') : t('bookCreate.flow.draftLocal')
}

const onNext = async (): Promise<void> => {
    errorMessage.value = problem()
    if (errorMessage.value !== '') {
        return
    }
    if (cursor.value >= pages.value.length - 1) {
        addEmptyPage()
        const index = pages.value.length - 1
        updatePage(index, { kind: 'content', isSilent: isWordless.value, ttsFallback: false })
        if (!isWordless.value) {
            addVoice(index)
        }
    }
    cursor.value += 1
    isPhotoMode.value = false
    await onSave()
}

const onFinish = async (): Promise<void> => {
    errorMessage.value = problem()
    if (errorMessage.value !== '') {
        return
    }
    await syncDraft()
    emit('finish')
}

watch(
    () => cursor.value,
    () => {
        isPhotoMode.value = false
        saveNotice.value = ''
        errorMessage.value = ''
    },
)

onMounted(() => {
    ensurePage()
    if (page.value && !isSilent.value && !isWordless.value && pageVoices.value.length === 0) {
        addVoice(cursor.value)
    }
})

</script>

<style scoped>
.page__head {
    justify-content: space-between;
}

.page__title {
    margin: 0;
}

.page__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    width: 100%;
    min-height: 52px;
    padding: 12px 16px;
    border: var(--outline) solid var(--ink);
    border-radius: 16px;
    background: var(--paper);
    color: var(--ink);
    cursor: pointer;
}

.cover__tile {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    width: 150px;
    aspect-ratio: 3 / 4;
    border: var(--outline) dashed var(--ink);
    border-radius: 16px;
    background: var(--paper) center / cover no-repeat;
    color: var(--ink);
    font: 700 0.875rem/1 var(--font-title);
    cursor: pointer;
}

.cover__tile--on {
    border-style: solid;
}

.cover__plus {
    font-size: 1.875rem;
}

.cover__label {
    padding: 2px 8px;
    border-radius: 999px;
    background: var(--paper);
}
</style>
