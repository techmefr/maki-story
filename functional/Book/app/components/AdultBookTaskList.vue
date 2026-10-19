<template>
    <ul class="book-tasks">
        <li v-for="book in books" :key="book.id">
            <NuxtLink :to="target(book)" class="book-tasks__card">
                <span class="book-tasks__cover"><BookCover :file-id="book.coverFileId" :src="book.coverUrl" :fallback="pickVoiceByText(book.id).hex" /></span>
                <span class="book-tasks__body">
                    <strong>{{ book.title }}</strong>
                    <span>{{ t(`review.bookStatus.${book.status}`) }}</span>
                    <AppProgress v-if="book.lineCount > 0" :value="Math.min(100, book.recordedCount / book.lineCount * 100)" :label="t('studio.progress')" />
                </span>
                <span class="book-tasks__action">{{ t(action) }}<AppIcon name="chevron-right" :size="20" class="mirror-rtl" /></span>
            </NuxtLink>
        </li>
    </ul>
</template>

<script setup lang="ts">
const { mode } = defineProps<{ books: IBookSummary[]; mode: 'record' | 'review' | 'correct' | 'propose' }>()
const { t } = useI18n()
const { isParent } = useCurrentMember()
const action = computed(() => mode === 'review' ? 'home.dash.toReview' : mode === 'correct' ? 'relative.redo' : mode === 'propose' ? 'homeBar.cards.proposalsWaiting' : 'relative.record')
const target = (book: IBookSummary): string => mode === 'review' && isParent.value ? `/books/${book.id}/review` : mode === 'propose' ? `/books/${book.id}` : `/books/${book.id}/studio`
</script>

<style scoped>
.book-tasks {
    display: grid;
    gap: 16px;
    margin: 0;
    padding: 0;
    list-style: none;
}

.book-tasks__card {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 16px;
    padding: 16px;
    border: var(--outline) solid var(--ink);
    border-radius: 24px;
    background: var(--paper);
    color: var(--ink);
    box-shadow: var(--shadow-lg);
    text-decoration: none;
}

.book-tasks__cover {
    flex: none;
    width: 56px;
}

.book-tasks__body {
    display: grid;
    flex: 1 1 120px;
    min-width: 0;
    gap: 8px;
    overflow-wrap: anywhere;
}

.book-tasks__body strong {
    font-size: 1.125rem;
}

.book-tasks__body > span {
    color: var(--ink-soft);
    font-size: 0.9375rem;
}

.book-tasks__action {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 48px;
    padding: 8px 16px;
    border: var(--outline) solid var(--ink);
    border-radius: 24px;
    background: var(--mint);
    color: var(--on-accent);
    font-weight: 700;
}
</style>
