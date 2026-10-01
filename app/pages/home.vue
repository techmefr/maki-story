<template>
    <div class="stack">
        <h1 class="title">Bibliothèque</h1>
        <GrimaceNudge />
        <NuxtLink v-if="unreadCount > 0" to="/messages" class="card card--tap row" style="background: #ffc940; color: inherit">
            <AppIcon name="message-heart" :size="30" motion="wiggle" />
            <span class="subtitle grow">{{ unreadLabel }}</span>
            <span class="badge">Écouter</span>
        </NuxtLink>
        <NuxtLink v-if="isOnline" to="/books/new" class="btn btn--block"><AppIcon name="book-plus" :size="22" motion="float" />Nouveau livre</NuxtLink>
        <button v-else type="button" class="btn btn--block" disabled><AppIcon name="cloud-off" :size="22" />Nouveau livre (connexion nécessaire)</button>
        <NuxtLink v-if="isOnline && isParent" to="/books/ai" class="btn btn--white btn--block" data-testid="ai-create">
            <AppIcon name="sparkles" :size="22" motion="float" />Créer une histoire avec l’IA
        </NuxtLink>
        <BookFilters @change="reload" />
        <div v-if="listed.length === 0 && drafts.length === 0 && isLoaded" class="card center stack">
            <AppMaki :size="80" />
            <p class="subtitle">{{ hasFilter ? 'Aucun livre ne correspond' : 'Aucun livre pour l’instant' }}</p>
            <p v-if="!hasFilter" class="muted">Photographie les pages d’un livre papier, découpe les répliques et colorie les voix.</p>
        </div>
        <AiDraftRow v-if="isParent && drafts.length > 0" :books="drafts" @changed="reload(activeQuery)" />
        <BookRow v-for="row in rows" :key="row.title" :title="row.title" :books="row.books" :has-download="row.hasDownload" @open="sheetBook = $event" />
        <BookSheet v-if="sheetBook" :book="sheetBook" @close="sheetBook = null" @share="startShare" />
        <ShareDialog v-if="shareTarget" :book="shareTarget" @close="shareTarget = null" />
    </div>
</template>

<script setup lang="ts">
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
const drafts = computed(() => books.value.filter(book => book.status === 'draft'))
const listed = computed(() => books.value.filter(book => book.status !== 'draft'))
const rows = computed(() =>
    [
        { title: 'Propositions à relire', books: listed.value.filter(book => book.submittedCount > 0), hasDownload: false },
        {
            title: 'En cours d’enregistrement',
            books: listed.value.filter(book => book.status !== 'ready' && book.recordedCount > 0),
            hasDownload: false,
        },
        {
            title: 'À enregistrer',
            books: listed.value.filter(book => book.status !== 'ready' && book.recordedCount === 0),
            hasDownload: false,
        },
        { title: 'Tous nos livres', books: listed.value, hasDownload: true },
    ].filter(row => row.books.length > 0),
)

const reload = async (query: IBookQuery): Promise<void> => {
    activeQuery.value = query
    await load(query)
}

const unreadCount = computed(() => (currentId.value ? unreadCountFor(currentId.value) : 0))
const unreadLabel = computed(() =>
    unreadCount.value > 1 ? `${unreadCount.value} messages t’attendent` : 'Un message t’attend',
)

onMounted(async () => {
    await Promise.all([load(), loadMessages(), ensureLoaded()])
    isLoaded.value = true
})
</script>
