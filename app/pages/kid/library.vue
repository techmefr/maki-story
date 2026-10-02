<template>
    <div class="stack">
        <StatusStrip />
        <AppButton variant="secondary" is-round to="/kid" :aria-label="t('common.back')"><AppIcon name="back" :size="26" class="mirror-rtl" /></AppButton>
        <h1 class="title">{{ t('kid.library.title') }}</h1>
        <BookFilters @change="reload" />
        <div class="grid grid--books">
            <div v-for="book in books" :key="book.id" class="stack" style="gap: 8px" :data-offline-card="book.title">
                <NuxtLink
                    :to="`/kid/listen/${book.id}`"
                    class="card card--tap stack"
                    style="color: inherit; text-decoration: none; min-height: 88px; gap: 8px"
                    :style="{ background: hexOfBook(book) }"
                >
                    <span class="subtitle">{{ book.title }}</span>
                    <span v-if="book.subtitle" class="muted">{{ book.subtitle }}</span>
                    <span class="row row--wrap">
                        <span v-if="ageLabel(book)" class="badge">{{ ageLabel(book) }}</span>
                        <VoiceDots :member-ids="book.readerIds" />
                    </span>
                </NuxtLink>
                <OfflineToggle :book-id="book.id" />
                <AppButton variant="secondary" size="sm" :aria-label="t('kid.library.sheetOf', { title: book.title })" @click="sheetBook = book">
                    <AppIcon name="book" :size="16" />{{ t('kid.library.sheet') }}
                </AppButton>
                <AppButton variant="secondary" size="sm" tone="mint"
                    v-if="newVoicesOf(book.id).length > 0"
                    :to="`/kid/activity/${book.id}`"
                    data-testid="new-voice-link"
                    :aria-label="t('review.kid.newVoicesFor', { title: book.title })">
                    <AppIcon name="sparkles" :size="18" motion="wiggle" />
                    <AppAvatar v-for="member in newVoicesOf(book.id)" :key="member.id" :member="member" :size="28" />
                </AppButton>
            </div>
        </div>
        <AppEmpty kind="library" v-if="books.length === 0 && isLoaded" :title="t('kid.library.empty')" :hint="t('kid.library.emptyHint')" />
        <BookSheet v-if="sheetBook" :book="sheetBook" @close="sheetBook = null" />
    </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'kid' })

const { t } = useI18n()
const { books, load } = useBooks()
const { load: loadMessages, startPolling, stopPolling } = useMessages()
const { ensureLoaded, getById } = useMembers()
const { loadNewVoices } = useReview()

const isLoaded = ref(false)
const newVoices = ref<INewVoices[]>([])

const newVoicesOf = (bookId: string): IMember[] => {
    const entry = newVoices.value.find(item => item.bookId === bookId)
    return (entry?.memberIds ?? []).map(id => getById(id)).filter((member): member is IMember => member !== null)
}
const sheetBook = ref<IBookSummary | null>(null)

const hexOfBook = (book: IBookSummary): string => pickVoiceByText(book.id).hex

const ageLabel = (book: IBookSummary): string => {
    if (book.ageMin === null) {
        return ''
    }
    if (book.ageMax === null || book.ageMax === book.ageMin) {
        return t('books.age.years', { count: book.ageMin })
    }
    return t('books.age.range', { count: book.ageMax, min: book.ageMin, max: book.ageMax })
}

const reload = (query: IBookQuery): Promise<void> => load(query)

onMounted(async () => {
    await Promise.all([load(), loadMessages(), ensureLoaded()])
    isLoaded.value = true
    try {
        newVoices.value = await loadNewVoices()
    } catch (error) {
        console.error('Les nouvelles voix n ont pas pu être chargées', error)
    }
    startPolling()
})

onBeforeUnmount(stopPolling)
</script>
