<template>
    <div class="stack">
        <h1 class="title">{{ t('home.title') }}</h1>
        <GrimaceNudge />
        <NuxtLink v-if="unreadCount > 0" to="/messages" class="card card--tap row" style="background: #ffc940; color: inherit">
            <AppIcon name="message-heart" :size="30" motion="wiggle" />
            <span class="subtitle grow">{{ unreadLabel }}</span>
            <span class="badge">{{ t('home.listen') }}</span>
        </NuxtLink>
        <NuxtLink v-if="isOnline" to="/books/new" class="btn btn--block"><AppIcon name="book-plus" :size="22" motion="float" />{{ t('home.newBook') }}</NuxtLink>
        <button v-else type="button" class="btn btn--block" disabled><AppIcon name="cloud-off" :size="22" />{{ t('home.newBookOffline') }}</button>
        <NuxtLink v-if="isOnline && isParent" to="/books/ai" class="btn btn--white btn--block" data-testid="ai-create">
            <AppIcon name="sparkles" :size="22" motion="float" />{{ t('home.createAi') }}
        </NuxtLink>
        <BookFilters @change="reload" />
        <AppEmpty
            v-if="listed.length === 0 && drafts.length === 0 && isLoaded"
            :title="hasFilter ? t('home.noMatch') : t('home.empty')"
            :hint="hasFilter ? t('home.noMatchHint') : t('home.emptyHint')"
        />
        <AiDraftRow v-if="isParent && drafts.length > 0" :books="drafts" @changed="reload(activeQuery)" />
        <BookRow v-for="row in rows" :key="row.title" :title="row.title" :books="row.books" :has-download="row.hasDownload" @open="sheetBook = $event" />
        <BookSheet v-if="sheetBook" :book="sheetBook" @close="sheetBook = null" @share="startShare" />
        <ShareDialog v-if="shareTarget" :book="shareTarget" @close="shareTarget = null" />
    </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const isOnline = useState<boolean>('is-online', () => true)
const { books, load } = useBooks()
const { currentId, isParent } = useCurrentMember()
const { ensureLoaded } = useMembers()
const { unreadCountFor, load: loadMessages } = useMessages()

const isLoaded = ref(false)
const sheetBook = ref<IBookSummary | null>(null)
const shareTarget = ref<IBookSummary | null>(null)
const activeQuery = ref<IBookQuery>({})

const startShare = (book: IBookSummary): void => {
    sheetBook.value = null
    shareTarget.value = book
}

const hasFilter = computed(() => Object.values(activeQuery.value).some(value => value !== undefined && value !== ''))
const drafts = computed(() => books.value.filter(book => book.status === 'draft' && book.aiGenerated))
const listed = computed(() => books.value.filter(book => !(book.status === 'draft' && book.aiGenerated)))
const rows = computed(() =>
    [
        { title: t('home.rows.review'), books: listed.value.filter(book => book.submittedCount > 0), hasDownload: false },
        {
            title: t('home.rows.recording'),
            books: listed.value.filter(book => book.status !== 'ready' && book.recordedCount > 0),
            hasDownload: false,
        },
        {
            title: t('home.rows.toRecord'),
            books: listed.value.filter(book => book.status !== 'ready' && book.recordedCount === 0),
            hasDownload: false,
        },
        { title: t('home.rows.all'), books: listed.value, hasDownload: true },
    ].filter(row => row.books.length > 0),
)

const reload = async (query: IBookQuery): Promise<void> => {
    activeQuery.value = query
    await load(query)
}

const unreadCount = computed(() => (currentId.value ? unreadCountFor(currentId.value) : 0))
const unreadLabel = computed(() => t('home.messagesWaiting', { count: unreadCount.value }))

onMounted(async () => {
    await Promise.all([load(), loadMessages(), ensureLoaded()])
    isLoaded.value = true
})
</script>
