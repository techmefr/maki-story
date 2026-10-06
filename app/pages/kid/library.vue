<template>
    <div class="stack">
        <StatusStrip />
        <AppButton variant="secondary" is-round to="/kid" :aria-label="t('common.back')"><AppIcon name="back" :size="26" class="mirror-rtl" /></AppButton>
        <h1 class="title">{{ t('kid.library.title') }}</h1>
        <BookSearchEntry />
        <BookFilters :initial="initialQuery" @change="reload" />
        <div class="stack" role="group" :aria-label="t('kidBrowse.reader.label')">
            <h2 class="label">{{ t('kidBrowse.reader.label') }}</h2>
            <div class="row row--wrap">
                <AppChip data-testid="reader-any" :selected="readerId === ''" @click="readerId = ''">{{ t('kidBrowse.reader.any') }}</AppChip>
                <AppChip v-for="reader in readers" :key="reader.id" :data-testid="`reader-${reader.id}`" :selected="readerId === reader.id" @click="toggleReader(reader.id)">
                    {{ reader.name }}
                </AppChip>
            </div>
        </div>
        <div class="browse" role="radiogroup" :aria-label="t('kidBrowse.browse.label')">
            <button
                v-for="item in BROWSE_MODES"
                :key="item"
                type="button"
                role="radio"
                class="browse__option"
                :class="{ 'browse__option--on': mode === item }"
                :aria-checked="mode === item"
                :data-testid="`browse-${item}`"
                @click="mode = item"
            >
                {{ t(`kidBrowse.browse.${item}`) }}
            </button>
        </div>
        <section v-for="section in sections" :key="section.id" class="stack">
            <h2 v-if="mode !== 'all'" class="subtitle">{{ section.title }}</h2>
        <div class="grid grid--books">
            <div v-for="book in section.books" :key="book.id" class="stack" style="gap: 8px" :data-offline-card="book.title">
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
        </section>
        <AppEmpty kind="library" v-if="visibleBooks.length === 0 && isLoaded" :title="t('kid.library.empty')" :hint="t('kid.library.emptyHint')" />
        <BookSheet v-if="sheetBook" :book="sheetBook" @close="sheetBook = null" />
    </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'kid' })

const { t } = useI18n()
const BROWSE_MODES = ['all', 'voice', 'mood', 'theme'] as const
type TBrowseMode = (typeof BROWSE_MODES)[number]

interface IBrowseSection {
    id: string
    title: string
    books: IBookSummary[]
}

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
const mode = ref<TBrowseMode>('all')
const readerId = ref('')

const readers = computed(() => {
    const ids = new Set(books.value.flatMap(book => book.readerIds))
    return [...ids].map(id => getById(id)).filter((member): member is IMember => member !== null)
})

const toggleReader = (id: string): void => {
    readerId.value = readerId.value === id ? '' : id
}

const visibleBooks = computed(() => (readerId.value ? books.value.filter(book => book.readerIds.includes(readerId.value)) : books.value))

const sections = computed<IBrowseSection[]>(() => {
    if (mode.value === 'all') {
        return [{ id: 'all', title: '', books: visibleBooks.value }]
    }
    const keysOf = (book: IBookSummary): string[] => {
        if (mode.value === 'voice') {
            return book.readerIds
        }
        return mode.value === 'mood' ? book.moods : book.themes
    }
    const titleOf = (key: string): string => {
        if (mode.value === 'voice') {
            return getById(key)?.name ?? key
        }
        return t(`library.filters.${mode.value === 'mood' ? 'moods' : 'themes'}.${key}`)
    }
    const keys = [...new Set(visibleBooks.value.flatMap(keysOf))]
    const grouped = keys.map(key => ({ id: key, title: titleOf(key), books: visibleBooks.value.filter(book => keysOf(book).includes(key)) }))
    const orphans = visibleBooks.value.filter(book => keysOf(book).length === 0)
    return orphans.length > 0 ? [...grouped, { id: 'other', title: t('kidBrowse.other'), books: orphans }] : grouped
})
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

const route = useRoute()
const initialQuery: IBookQuery = {
    type: typeof route.query.type === 'string' ? route.query.type : undefined,
    mood: typeof route.query.mood === 'string' ? route.query.mood : undefined,
    theme: typeof route.query.theme === 'string' ? route.query.theme : undefined,
}

const reload = (query: IBookQuery): Promise<void> => load(query)

onMounted(async () => {
    await Promise.all([load(initialQuery), loadMessages(), ensureLoaded()])
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

<style scoped>
.browse {
    display: flex;
    border: 3px solid var(--ink);
    border-radius: 999px;
    overflow: hidden;
    background: var(--paper);
}

.browse__option {
    flex: 1;
    min-height: var(--tap);
    padding: 8px 10px;
    border: 0;
    background: transparent;
    color: var(--ink);
    font: 700 1rem/1.15 var(--font-title);
    cursor: pointer;
    overflow-wrap: anywhere;
}

.browse__option--on {
    background: var(--violet);
    color: var(--on-accent);
}
</style>
