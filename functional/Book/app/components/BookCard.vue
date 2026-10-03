<template>
    <NuxtLink :to="target" class="card card--tap book">
        <span v-if="hasDot" class="book__dot" data-testid="review-dot" role="img" :aria-label="dotLabel" />
        <div class="book__cover" :style="{ background: `repeating-linear-gradient(135deg, ${hex} 0 10px, ${hexLight} 10px 20px)` }">
            <AppIcon :name="isReady ? 'play' : 'mic'" :size="26" class="book__icon" :motion="isReady ? 'pulse' : 'wiggle'" />
            <span class="book__kind">{{ kindLabel }}</span>
        </div>
        <div class="grow stack" style="gap: 6px">
            <div class="subtitle">{{ book.title }}</div>
            <div class="row row--wrap">
                <span class="badge" :style="{ background: statusBg }">{{ statusLabel }}</span>
                <span v-if="book.isVoiceBlocked" class="badge" style="background: #FF7766">{{ t('books.card.voiceBlocked') }}</span>
                <VoiceDots :member-ids="book.memberIds" />
            </div>
            <div class="muted">{{ progressLabel }}</div>
        </div>
    </NuxtLink>
</template>

<script setup lang="ts">
const { book } = defineProps<{ book: IBookSummary }>()

const { t } = useI18n()
const palette = computed(() => pickVoiceByText(book.id))
const hex = computed(() => palette.value.hex)
const hexLight = computed(() => palette.value.hexLight)
const { current } = useCurrentMember()

const isReady = computed(() => book.status === 'ready')
const isParent = computed(() => current.value?.role === 'parent')
const hasDot = computed(() => isParent.value && book.submittedCount > 0)
const dotLabel = computed(() => (hasDot.value ? t('review.dotLabel') : ''))
const target = computed(() => {
    if (hasDot.value) {
        return `/books/${book.id}/review`
    }
    return isReady.value ? `/books/${book.id}/play` : `/books/${book.id}/studio`
})
const statusLabel = computed(() => t(`review.bookStatus.${book.status}`))
const statusBg = computed(() => (isReady.value ? '#4AD3A5' : '#FFF3DC'))
const kindLabel = computed(() => (book.kind === 'solo' ? t('books.card.kindSolo') : t('books.card.kindCast')))
const progressLabel = computed(() => t('books.card.progress', { recorded: book.recordedCount, total: book.lineCount }))
</script>

<style scoped>
.book {
    position: relative;
    display: flex;
    gap: 14px;
    align-items: center;
    color: inherit;
    text-decoration: none;
}

.book__dot {
    position: absolute;
    top: -8px;
    right: -8px;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--coral);
    border: 3px solid var(--ink);
    box-shadow: 2px 2px 0 var(--ink);
}

.book__cover {
    width: 76px;
    height: 96px;
    border: 2.5px solid var(--ink);
    border-radius: 12px;
    flex-shrink: 0;
    display: flex;
    align-items: flex-end;
    padding: 6px;
}

.book__icon {
    background: var(--paper);
    border: 2px solid var(--ink);
    border-radius: 50%;
    padding: 4px;
    margin-bottom: 6px;
}

.book__cover {
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-end;
}

.book__kind {
    font: 700 0.6875rem/1 var(--font-title);
    background: var(--paper);
    border: 2px solid var(--ink);
    border-radius: 999px;
    padding: 3px 7px;
}
</style>
