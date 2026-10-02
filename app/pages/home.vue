<template>
    <div class="stack">
        <StatusStrip />
        <h1 class="title">{{ t('home.title') }}</h1>
        <GrimaceNudge />
        <BirthDateNudge />
        <NuxtLink v-if="unreadCount > 0" to="/messages" class="card card--tap row" style="background: #ffc940; color: inherit">
            <AppIcon name="message-heart" :size="30" motion="wiggle" />
            <span class="subtitle grow">{{ unreadLabel }}</span>
            <span class="badge">{{ t('home.listen') }}</span>
        </NuxtLink>
        <NuxtLink v-for="child in missingBirthDates" :key="child.id" :to="`/family/${child.id}`" class="card card--tap row" style="color: inherit">
            <AppIcon name="party" :size="28" motion="wiggle" />
            <span class="grow">{{ t('home.birthdayMissing', { name: child.name }) }}</span>
        </NuxtLink>
        <AppButton is-block v-if="isOnline" to="/books/new"><AppIcon name="book-plus" :size="22" motion="float" />{{ t('home.newBook') }}</AppButton>
        <AppButton is-block v-else disabled><AppIcon name="cloud-off" :size="22" />{{ t('home.newBookOffline') }}</AppButton>
        <AppButton variant="secondary" is-block v-if="isAiCreationEnabled && isOnline && isParent" to="/books/ai" data-testid="ai-create">
            <AppIcon name="sparkles" :size="22" motion="float" />{{ t('home.createAi') }}
        </AppButton>
        <BookFilters @change="reload" />
        <AppEmpty
            kind="library"
            v-if="listed.length === 0 && drafts.length === 0 && proposals.length === 0 && isLoaded"
            :title="hasFilter ? t('home.noMatch') : t('home.empty')"
            :hint="hasFilter ? t('home.noMatchHint') : t('home.emptyHint')"
        />
        <ProposalRow v-if="isParent && proposals.length > 0" :books="proposals" @open="sheetBook = $event" @changed="reload(activeQuery)" />
        <AiDraftRow v-if="isAiCreationEnabled && isParent && drafts.length > 0" :books="drafts" @changed="reload(activeQuery)" />
        <BookRow v-for="row in rows" :key="row.title" :title="row.title" :books="row.books" :has-download="row.hasDownload" @open="sheetBook = $event" />
        <BookSheet v-if="sheetBook" :book="sheetBook" @close="sheetBook = null" @share="startShare" />
        <ShareDialog v-if="shareTarget" :book="shareTarget" @close="shareTarget = null" />
    </div>
</template>

<script setup lang="ts">
const isAiCreationEnabled = useAiCreationEnabled()
const { t } = useI18n()
const isOnline = useState<boolean>('is-online', () => true)
const { books, load } = useBooks()
const { currentId, isParent } = useCurrentMember()
const { ensureLoaded, children } = useMembers()
const { unreadCountFor, load: loadMessages } = useMessages()

const isLoaded = ref(false)
const missingBirthDates = computed(() => (isParent.value ? children.value.filter(child => !child.isGuest && !child.birthDate) : []))
const sheetBook = ref<IBookSummary | null>(null)
const shareTarget = ref<IBookSummary | null>(null)
const activeQuery = ref<IBookQuery>({})

const startShare = (book: IBookSummary): void => {
    sheetBook.value = null
    shareTarget.value = book
}

const hasFilter = computed(() => Object.values(activeQuery.value).some(value => value !== undefined && value !== ''))
const drafts = computed(() => books.value.filter(book => book.status === 'draft' && book.aiGenerated))
const proposals = computed(() => books.value.filter(book => book.status === 'proposed'))
const listed = computed(() => books.value.filter(book => !(book.status === 'draft' && book.aiGenerated) && book.status !== 'proposed'))
const rows = computed(() =>
    [
        { title: t('library.rows.myProposals'), books: isParent.value ? [] : proposals.value, hasDownload: false },
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
