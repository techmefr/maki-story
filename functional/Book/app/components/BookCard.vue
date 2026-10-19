<template>
    <div class="book" :class="{ 'book--adult': !isChild }">
        <NuxtLink :to="target" class="book__link stack" :data-offline-card="book.title">
            <span v-if="hasDot" class="book__dot" data-testid="review-dot" role="img" :aria-label="dotLabel" />
            <BookCover :file-id="book.coverFileId" :src="book.coverUrl" :fallback="hex" />
            <span class="subtitle book__title">{{ book.title }}</span>
            <span v-if="!isChild && book.author" class="book__author">{{ book.author }}</span>
            <span v-if="showStatus" class="badge book__status" :class="`book__status--${book.status}`">{{ statusLabel }}</span>
        </NuxtLink>
        <AppButton
            v-if="hasSheet"
            class="book__sheet"
            variant="secondary"
            size="sm"
            is-round
            :aria-label="t('books.sheet.title', { title: book.title })"
            @click="emit('open', book)"
        >
            <AppIcon name="book" :size="16" />
        </AppButton>
    </div>
</template>

<script setup lang="ts">
const { book, to = '', hasSheet = false, showStatus = false } = defineProps<{ book: IBookSummary; to?: string; hasSheet?: boolean; showStatus?: boolean }>()
const emit = defineEmits<{ open: [book: IBookSummary] }>()

const { t } = useI18n()
const hex = computed(() => pickVoiceByText(book.id).hex)
const { current, isChild } = useCurrentMember()

const isParent = computed(() => current.value?.role === 'parent')
const hasDot = computed(() => isParent.value && book.submittedCount > 0)
const dotLabel = computed(() => (hasDot.value ? t('review.dotLabel') : ''))
const target = computed(() => {
    if (to) {
        return to
    }
    if (hasDot.value) {
        return `/books/${book.id}/review`
    }
    return isChild.value ? `/kid/listen/${book.id}` : `/books/${book.id}`
})
const statusLabel = computed(() => t(`review.bookStatus.${book.status}`))
</script>

<style scoped>
.book--adult {
    height: 100%;
    padding: 12px;
    border: var(--outline) solid var(--ink);
    border-radius: 24px;
    background: var(--paper);
    box-shadow: var(--shadow-lg);
}

.book--adult .book__link {
    height: 100%;
    gap: 12px;
}

.book--adult .book__title {
    text-align: start;
    font-size: 1.125rem;
    line-height: 1.2;
}

.book__author {
    color: var(--ink-soft);
    font-size: 0.875rem;
    overflow-wrap: anywhere;
}

.book--adult .book__status {
    align-self: flex-start;
    margin-top: auto;
    padding: 4px 12px;
    font-size: 0.875rem;
}

.book__status--ready {
    background: var(--mint-soft);
    color: var(--on-accent);
}

.book__status--in_review {
    background: var(--yellow);
    color: var(--on-accent);
}

.book__status--proposed {
    background: var(--sky);
    color: var(--on-accent);
}

.book--adult .book__sheet {
    top: 20px;
    inset-inline-start: 20px;
}

.book {
    position: relative;
}

.book__link {
    gap: 8px;
    color: inherit;
    text-decoration: none;
}

.book__title {
    text-align: center;
    overflow-wrap: anywhere;
}

.book__status {
    align-self: center;
}

.book__dot {
    position: absolute;
    top: -8px;
    inset-inline-end: -8px;
    z-index: 1;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--coral);
    border: 3px solid var(--ink);
    box-shadow: 2px 2px 0 var(--ink);
}

.book__sheet {
    position: absolute;
    top: 8px;
    inset-inline-start: 8px;
}
</style>
