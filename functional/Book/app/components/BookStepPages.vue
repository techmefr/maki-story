<template>
    <div class="stack">
        <p class="muted">{{ t('bookDraft.pages.introAccordion') }}</p>
        <section v-if="!isSimple && !isWordless" class="card stack" :aria-label="t('bookDraft.wizard.stepCharacters')">
            <button type="button" class="accordion__head" :aria-expanded="isCastOpen" data-testid="accordion-cast" @click="isCastOpen = !isCastOpen">
                <span class="subtitle">{{ t('bookDraft.wizard.stepCharacters') }}</span>
                <span class="badge">{{ characters.length }}</span>
            </button>
            <BookStepCharacters v-if="isCastOpen" :has-next="false" />
        </section>
        <section v-for="(page, index) in pages" :key="page.key" class="card stack" role="group" :aria-label="t('bookDraft.shared.page', { n: index + 1 })">
            <div class="row">
                <button type="button" class="accordion__head grow" :aria-expanded="isOpen(page.key)" :data-testid="`accordion-page-${index + 1}`" @click="toggle(page.key)">
                    <span class="subtitle">{{ t('bookDraft.shared.page', { n: index + 1 }) }}<template v-if="page.title"> · {{ page.title }}</template></span>
                    <span v-if="page.kind === 'cover'" class="badge">{{ t('bookDraft.shared.cover') }}</span>
                    <span v-else-if="page.kind === 'empty'" class="badge">{{ t('bookDraft.shared.emptyPage') }}</span>
                    <span v-else-if="!isWordless" class="badge">{{ t('bookDraft.lines.count', { count: linesOfPage(index).length }) }}</span>
                </button>
                <AppButton variant="secondary" size="sm" :aria-label="t('bookDraft.pages.removePage', { n: index + 1 })" @click="removePage(index)">×</AppButton>
            </div>
            <div v-if="isOpen(page.key)" class="stack">
                <div v-if="page.previewUrl" class="thumb" :style="{ backgroundImage: `url(${page.previewUrl})` }" />
                <template v-if="page.kind === 'empty'">
                    <p class="muted">{{ t('bookDraft.pages.emptyNote') }}</p>
                    <AppCheckbox :model-value="page.ttsFallback" @update:model-value="updatePage(index, { ttsFallback: Boolean($event) })">{{ t('bookDraft.pages.ttsFallback') }}</AppCheckbox>
                </template>
                <template v-else>
                    <AppChip :selected="page.kind === 'cover'" @click="toggleCover(index)">{{ t('bookDraft.shared.cover') }}</AppChip>
                    <label class="stack" style="gap: 6px">
                        <span class="label">{{ t('bookDraft.pages.pageTitle') }}</span>
                        <AppInput :model-value="page.title" maxlength="80" :placeholder="t('bookDraft.pages.pageTitlePlaceholder')" @update:model-value="updatePage(index, { title: $event })" />
                    </label>
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
                        <div v-for="(panel, panelIndex) in page.panels" :key="panel.key" class="stack panel">
                            <div class="row">
                                <label class="stack grow" style="gap: 4px">
                                    <span class="label">{{ t('bookDraft.shared.panel', { n: panelIndex + 1 }) }}</span>
                                    <input
                                        class="input"
                                        :value="panel.description"
                                        :placeholder="t('bookDraft.pages.panelPlaceholder')"
                                        @input="updatePanel(index, panelIndex, ($event.target as HTMLInputElement).value)"
                                    />
                                </label>
                                <AppButton variant="secondary" size="sm" :aria-label="t('bookDraft.pages.removePanel', { panel: panelIndex + 1, page: index + 1 })" @click="removePanel(index, panelIndex)">×</AppButton>
                            </div>
                            <AppCheckbox :model-value="panel.isSilent === true" @update:model-value="setPanelSilent(index, panelIndex, Boolean($event))">{{ t('bookDraft.pages.silentPanel') }}</AppCheckbox>
                            <BookLineRow v-for="line in linesOfPanel(index, panelIndex)" :key="line.key" :line="line" />
                        </div>
                        <AppButton variant="secondary" size="sm" @click="addPanel(index)">{{ t('bookDraft.pages.addPanel') }}</AppButton>
                    </div>
                    <div v-if="!isWordless && page.panels.length === 0" class="row row--wrap" role="group" :aria-label="t('bookDraft.pages.voiceChoice')">
                        <AppChip :selected="page.isSilent === true" :data-testid="`page-silent-${index + 1}`" @click="updatePage(index, { isSilent: true })">{{ t('bookDraft.pages.choiceSilent') }}</AppChip>
                        <AppChip :selected="page.isSilent !== true" :data-testid="`page-voice-${index + 1}`" @click="updatePage(index, { isSilent: false })">{{ t('bookDraft.pages.choiceVoice') }}</AppChip>
                    </div>
                    <template v-if="!isWordless && (page.isSilent !== true || page.panels.length > 0)">
                        <BookLineRow v-for="line in linesOfPanel(index, null)" :key="line.key" :line="line" />
                        <BookLineComposer :page-index="index" :panels="page.panels" />
                    </template>
                </template>
            </div>
        </section>
        <section v-if="pages.length === 0 && !isWordless && !isComic" class="card stack" role="group" :aria-label="t('bookDraft.shared.page', { n: 1 })">
            <span class="subtitle">{{ t('bookDraft.shared.page', { n: 1 }) }}</span>
            <BookLineRow v-for="line in linesOfPanel(0, null)" :key="line.key" :line="line" />
            <BookLineComposer :page-index="0" :panels="[]" />
        </section>
        <AppButton as="label" is-block>
            {{ t('bookDraft.pages.addWithPhoto') }}
            <input type="file" accept="image/*" capture="environment" multiple hidden data-testid="add-photo-input" @change="addPhotos" />
        </AppButton>
        <AppButton v-if="!isWordless" variant="secondary" is-block data-testid="add-silent-page" @click="addSilentPage">{{ t('bookDraft.pages.addSilent') }}</AppButton>
        <div v-if="isBusy" class="muted" role="status">{{ t('bookDraft.pages.sending') }}</div>
        <div v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</div>
        <div v-if="needsPhoto" class="muted">{{ t('bookDraft.pages.needsPhoto') }}</div>
        <div v-if="saveNotice" class="muted" role="status">{{ saveNotice }}</div>
        <div class="row">
            <AppButton variant="secondary" class="grow" data-testid="save-draft" @click="saveForLater">{{ t('bookDraft.pages.saveDraft') }}</AppButton>
            <AppButton class="grow" :disabled="isBusy || needsPhoto" data-testid="pages-finish" @click="emit('next')">{{ t('bookDraft.pages.finish') }}</AppButton>
        </div>
    </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{ next: [] }>()

const { t } = useI18n()
const { pages, characters, isSimple, isComic, isWordless, linesOfPage, linesOfPanel, addPhoto, addEmptyPage, updatePage, removePage, addPanel, updatePanel, setPanelSilent, removePanel, saveDraft } = useBookDraft()
const { upload } = useFiles()

const isBusy = ref(false)
const errorMessage = ref('')
const saveNotice = ref('')
const isCastOpen = ref(false)
const openKeys = ref<number[]>(pages.value.length > 0 ? [pages.value[0]!.key] : [])

const isOpen = (key: number): boolean => openKeys.value.includes(key)
const toggle = (key: number): void => {
    openKeys.value = isOpen(key) ? openKeys.value.filter(item => item !== key) : [...openKeys.value, key]
}

const hasPhoto = computed(() => pages.value.some(page => page.fileId !== null))
const needsPhoto = computed(() => (isComic.value || isWordless.value) && !hasPhoto.value)

const openLast = (): void => {
    const last = pages.value[pages.value.length - 1]
    if (last) {
        openKeys.value = [...openKeys.value, last.key]
    }
}

const addSilentPage = (): void => {
    addEmptyPage()
    openLast()
}

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
            openLast()
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

const saveForLater = (): void => {
    saveDraft()
    saveNotice.value = t('bookDraft.pages.draftSaved')
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

.accordion__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-height: var(--tap);
    width: 100%;
    border: 0;
    background: none;
    text-align: start;
    cursor: pointer;
}

.panel {
    border-inline-start: 4px solid var(--ink);
    padding-inline-start: 10px;
}
</style>
