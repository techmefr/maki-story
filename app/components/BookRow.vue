<template>
    <section class="stack" :aria-labelledby="headingId">
        <h2 :id="headingId" class="subtitle">{{ title }} <span class="muted">({{ books.length }})</span></h2>
        <div class="book-row">
            <div v-for="book in books" :key="book.id" class="book-row__item stack" style="gap: 8px">
                <BookCard :book="book" />
                <AppButton variant="secondary" size="sm" :aria-label="t('books.sheet.title', { title: book.title })" @click="emit('open', book)">
                    <AppIcon name="book" :size="16" />{{ t('books.row.sheet') }}
                </AppButton>
                <OfflineToggle v-if="hasDownload && book.status === 'ready'" :book-id="book.id" />
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
const { title, books, hasDownload = false } = defineProps<{ title: string; books: IBookSummary[]; hasDownload?: boolean }>()
const emit = defineEmits<{ open: [book: IBookSummary] }>()

const { t } = useI18n()
const headingId = computed(() => `row-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`)
</script>

<style scoped>
.book-row {
    display: flex;
    gap: 14px;
    overflow-x: auto;
    padding-block: 4px 12px;
    padding-inline: 4px 6px;
    scroll-snap-type: x proximity;
}

.book-row__item {
    flex: 0 0 min(300px, 82vw);
    scroll-snap-align: start;
}
</style>
