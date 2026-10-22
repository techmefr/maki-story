<template>
    <section class="home-feature home__panel" aria-labelledby="home-feature-title">
        <p class="home-feature__eyebrow">{{ t('appearance.featured') }}</p>
        <div class="home-feature__body">
            <NuxtLink :to="target" class="home-feature__cover" :aria-label="book.title"><BookCover :file-id="book.coverFileId" :src="book.coverUrl" :fallback="pickVoiceByText(book.id).hex" /></NuxtLink>
            <div class="stack home-feature__details">
                <h2 id="home-feature-title" class="subtitle">{{ book.title }}</h2>
                <p v-if="book.author" class="home-feature__author">{{ book.author }}</p>
                <span class="home-feature__status">{{ t(`review.bookStatus.${book.status}`) }}</span>
                <AppProgress v-if="book.lineCount > 0 && book.status !== 'ready'" :value="Math.min(100, book.recordedCount / book.lineCount * 100)" :label="t('studio.progress')" />
                <AppButton :to="target" :icon="actionIcon">{{ t(actionLabel) }}</AppButton>
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
const { book } = defineProps<{ book: IBookSummary }>()
const { t } = useI18n()
const { isParent } = useCurrentMember()
const isReview = computed(() => isParent.value && (book.status === 'in_review' || book.submittedCount > 0))
const isRecording = computed(() => book.status === 'to_record' || book.changesRequestedCount > 0)
const target = computed(() => isReview.value ? `/books/${book.id}/review` : isRecording.value ? `/books/${book.id}/studio` : `/books/${book.id}`)
const actionLabel = computed(() => isReview.value ? 'home.dash.toReview' : isRecording.value ? 'relative.record' : 'appearance.openBook')
const actionIcon = computed<IconName>(() => isReview.value ? 'check' : isRecording.value ? 'mic' : 'book')
</script>

<style scoped>
.home-feature { display: flex; flex-direction: column; gap: 20px; min-width: 0; }
.home-feature__eyebrow { margin: 0; color: var(--ink-soft); font-weight: 600; }
.home-feature__body { display: grid; grid-template-columns: minmax(88px, 32%) minmax(0, 1fr); gap: 20px; align-items: center; }
.home-feature__cover { display: block; border-radius: 14px; overflow: hidden; box-shadow: 0 8px 16px #50311620; }
.home-feature__details { min-width: 0; align-items: flex-start; gap: 14px; }
.home-feature__author { margin: 0; color: var(--ink-soft); }
.home-feature__status { color: var(--ink-soft); font-size: 0.9375rem; }
.home-feature__details :deep(.progress) { width: 100%; }
@media (max-width: 389px) {
    .home-feature__body { gap: 12px; grid-template-columns: 80px minmax(0, 1fr); }
    .home-feature__details :deep(.subtitle) { font-size: 1.125rem; }
    .home-feature__details :deep(.btn) { padding: 10px; font-size: 0.9375rem; }
}
</style>
