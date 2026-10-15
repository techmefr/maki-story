<template>
    <div class="stack">
        <StatusStrip />
        <h1 v-if="hasTitle" class="title">{{ t('home.title') }}</h1>
        <GrimaceNudge />
        <BirthDateNudge />
        <NuxtLink v-if="unreadCount > 0" to="/messages" class="card card--tap row">
            <AppIcon name="message-heart" :size="30" motion="wiggle" />
            <span class="subtitle grow">{{ unreadLabel }}</span>
            <span class="badge">{{ t('home.listen') }}</span>
        </NuxtLink>
        <p v-if="isParent && usage && usage.limits.books !== null" class="library__usage" data-testid="plan-books-usage">{{ t('library.planUsage', { used: usage.books, limit: usage.limits.books }) }}</p>
        <div class="library__actions">
            <AppButton v-if="isOnline" class="library__action" to="/books/new"><AppIcon name="book-plus" :size="22" motion="float" />{{ t('home.newBook') }}</AppButton>
            <AppButton v-else class="library__action" disabled><AppIcon name="cloud-off" :size="22" />{{ t('home.newBookOffline') }}</AppButton>
            <AppButton variant="secondary" v-if="isAiCreationEnabled && isOnline && isParent" class="library__action" to="/books/ai" data-testid="ai-create">
                <AppIcon name="sparkles" :size="22" motion="float" />{{ t('home.createAi') }}
            </AppButton>
        </div>
        <BookFilters :initial="initialQuery" @change="reload" />
        <AppEmpty
            kind="library"
            v-if="listed.length === 0 && drafts.length === 0 && proposals.length === 0 && isLoaded"
            :title="hasFilter ? t('home.noMatch') : t('home.empty')"
            :hint="hasFilter ? t('home.noMatchHint') : t('home.emptyHint')"
        />
        <ProposalRow v-if="isParent && proposals.length > 0" :books="proposals" @open="sheetBook = $event" @changed="reload(activeQuery)" />
        <AiDraftRow v-if="isAiCreationEnabled && isParent && drafts.length > 0" :books="drafts" @changed="reload(activeQuery)" />
        <div v-if="shown.length > 0" class="grid grid--books">
            <BookCard v-for="book in shown" :key="book.id" :book="book" show-status has-sheet @open="sheetBook = $event" />
        </div>
        <BookSheet v-if="sheetBook" :book="sheetBook" @close="sheetBook = null" @share="startShare" />
        <ShareDialog v-if="shareTarget" :book="shareTarget" @close="shareTarget = null" />
    </div>
</template>

<script setup lang="ts">
const { hasTitle = true } = defineProps<{ hasTitle?: boolean }>()
const isAiCreationEnabled = useAiCreationEnabled()
const { t } = useI18n()
const isOnline = useState<boolean>('is-online', () => true)
const { books, load } = useBooks()
const { currentId, isParent } = useCurrentMember()
const { ensureLoaded } = useMembers()
const { usage, load: loadPlan } = usePlan()
const { unreadCountFor, load: loadMessages } = useMessages()

const isLoaded = ref(false)
const sheetBook = ref<IBookSummary | null>(null)
const shareTarget = ref<IBookSummary | null>(null)
const route = useRoute()
const initialQuery: IBookQuery = {
    type: typeof route.query.type === 'string' ? route.query.type : undefined,
    mood: typeof route.query.mood === 'string' ? route.query.mood : undefined,
    theme: typeof route.query.theme === 'string' ? route.query.theme : undefined,
    tag: typeof route.query.tag === 'string' ? route.query.tag : undefined,
    status: typeof route.query.status === 'string' ? route.query.status : undefined,
}
const activeQuery = ref<IBookQuery>(initialQuery)

const startShare = (book: IBookSummary): void => {
    sheetBook.value = null
    shareTarget.value = book
}

const hasFilter = computed(() => Object.values(activeQuery.value).some(value => value !== undefined && value !== ''))
const drafts = computed(() => books.value.filter(book => book.status === 'draft' && book.aiGenerated))
const proposals = computed(() => books.value.filter(book => book.status === 'proposed'))
const listed = computed(() => books.value.filter(book => !(book.status === 'draft' && book.aiGenerated) && book.status !== 'proposed'))
const shown = computed(() => (isParent.value ? listed.value : [...proposals.value, ...listed.value]))

const reload = async (query: IBookQuery): Promise<void> => {
    activeQuery.value = query
    await load(query)
}

const unreadCount = computed(() => (currentId.value ? unreadCountFor(currentId.value) : 0))
const unreadLabel = computed(() => t('home.messagesWaiting', { count: unreadCount.value }))

onMounted(async () => {
    await Promise.all([load(initialQuery), loadMessages(), ensureLoaded(), loadPlan()])
    isLoaded.value = true
})
</script>

<style scoped>
.library__usage {
    margin: 0;
    color: var(--ink-soft);
    font: 600 0.9375rem/1.3 var(--font-body);
}

.library__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
}

.library__action {
    flex: 1 1 200px;
}
</style>
