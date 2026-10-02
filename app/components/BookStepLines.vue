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
                <BookPageView
                    :view="viewOf(page, index)"
                    mode="create"
                    :page-number="index + 1"
                    :page-count="Math.max(1, pages.length)"
                    :language="language"
                    :show-lines="false"
                    :show-nav="false"
                    @update-description="updatePage(index, { description: $event })"
                    @update-character="(id, value) => updateCharacter(Number(id), { description: value })"
                />
                <div v-for="(panel, panelIndex) in page.panels" :key="panel.key" class="stack panel">
                    <div class="label">{{ panel.description ? t('bookDraft.lines.panelWithDescription', { n: panelIndex + 1, description: panel.description }) : t('bookDraft.shared.panel', { n: panelIndex + 1 }) }}</div>
                    <BookLineRow v-for="line in linesOfPanel(index, panelIndex)" :key="line.key" :line="line" />
                </div>
                <BookLineRow v-for="line in linesOfPanel(index, null)" :key="line.key" :line="line" />
                <BookLineComposer :page-index="index" :panels="page.panels" />
            </template>
        </div>
        <div v-if="!hasLines" class="muted">{{ t('bookDraft.lines.needOne') }}</div>
        <button type="button" class="btn btn--block" :disabled="!hasLines" @click="emit('next')">{{ t('common.next') }}</button>
    </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{ next: [] }>()

const { t } = useI18n()
const { pages, hasLines, isSimple, language, readerId, linesOfPage, linesOfPanel, updatePage, updateCharacter, characterByKey, effectiveCharacterKey } = useBookDraft()

const viewOf = (page: IDraftPage, index: number): IPageView => {
    const keys = [...new Set(linesOfPage(index).map(line => effectiveCharacterKey(line)).filter((key): key is number => key !== null))]
    return {
        fileId: page.fileId,
        previewUrl: page.previewUrl,
        description: page.description,
        panelCount: page.panels.length,
        characters: keys.flatMap(key => {
            const character = characterByKey(key)
            if (!character) {
                return []
            }
            return [
                {
                    id: String(character.key),
                    name: character.name,
                    color: character.isNarrator ? null : character.color,
                    isNarrator: character.isNarrator,
                    description: character.description,
                    readerId: isSimple.value ? readerId.value : character.memberId,
                    lines: [],
                },
            ]
        }),
    }
}

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
