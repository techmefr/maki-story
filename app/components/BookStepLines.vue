<template>
    <div class="stack">
        <p class="muted">{{ t(isSimple ? 'bookDraft.lines.introSimple' : 'bookDraft.lines.introCast') }}</p>
        <div v-for="(page, index) in displayPages" :key="page.key" class="card stack" role="group" :aria-label="t('bookDraft.shared.page', { n: index + 1 })">
            <div class="row" style="justify-content: space-between">
                <span class="subtitle">{{ t('bookDraft.shared.page', { n: index + 1 }) }}</span>
                <span v-if="page.kind === 'cover'" class="badge">{{ t('bookDraft.shared.cover') }}</span>
                <span v-else-if="page.kind === 'empty'" class="badge">{{ t('bookDraft.shared.emptyPage') }}</span>
                <span v-else class="badge">{{ t('bookDraft.lines.count', { count: linesOfPage(index).length }) }}</span>
            </div>
            <p v-if="page.kind === 'empty'" class="muted">{{ t('bookDraft.lines.emptyNote') }}</p>
            <template v-else>
                <div v-if="page.description" class="muted">{{ t('bookDraft.lines.image', { description: page.description }) }}</div>
                <div v-for="(panel, panelIndex) in page.panels" :key="panel.key" class="stack panel">
                    <div class="label">{{ panel.description ? t('bookDraft.lines.panelWithDescription', { n: panelIndex + 1, description: panel.description }) : t('bookDraft.shared.panel', { n: panelIndex + 1 }) }}</div>
                    <BookLineRow v-for="line in linesOfPanel(index, panelIndex)" :key="line.key" :line="line" />
                </div>
                <BookLineRow v-for="line in linesOfPanel(index, null)" :key="line.key" :line="line" />
                <BookLineComposer :page-index="index" :panels="page.panels" />
            </template>
        </div>
        <div v-if="!hasLines" class="muted">{{ t('bookDraft.lines.needOne') }}</div>
        <AppButton is-block :disabled="!hasLines" @click="emit('next')">{{ t('common.next') }}</AppButton>
    </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{ next: [] }>()

const { t } = useI18n()
const { pages, hasLines, isSimple, linesOfPage, linesOfPanel } = useBookDraft()

const displayPages = computed<IDraftPage[]>(() =>
    pages.value.length > 0
        ? pages.value
        : [{ key: 0, fileId: null, previewUrl: '', kind: 'content', ttsFallback: false, description: '', panels: [] }],
)
</script>

<style scoped>
.panel {
    border-inline-start: 4px solid var(--ink);
    padding-inline-start: 10px;
}
</style>
