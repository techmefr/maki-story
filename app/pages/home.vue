<template>
    <div class="stack home">
        <StatusStrip v-if="isParent" />
        <header class="home__intro" data-testid="adult-home-welcome">
            <div class="stack home__greeting">
                <h1 class="title">{{ t(isEvening ? 'home.adult.evening' : 'home.adult.greeting', { name: current?.name ?? '' }) }}</h1>
                <p class="home__subtitle">{{ t('home.adult.subtitle') }}</p>
            </div>
            <AppButton :variant="featuredBook ? 'secondary' : 'primary'" to="/books/new" icon="book-plus" data-testid="home-card-new-book">{{ t(isParent ? 'home.dash.newBook' : 'home.dash.proposeBook') }}</AppButton>
            <AppButton variant="secondary" to="/library" icon="book">{{ t('home.dash.library') }}</AppButton>
        </header>
        <p v-if="loadError" class="error" role="alert">{{ loadError }}</p>
        <div class="home__overview">
            <HomeFeaturedBook v-if="featuredBook" :book="featuredBook" />
            <section v-if="kids.length > 0 && (isParent || flow.families.length === 0)" class="stack home__panel home__family" aria-labelledby="adult-home-children">
                <h2 id="adult-home-children" class="subtitle">{{ t('home.dash.myChildren') }}</h2>
                <HomeKidCards :kids="kids" :counts="liveCounts" />
            </section>
            <AppEmpty v-else-if="isLoaded && kids.length === 0 && (isParent || flow.families.length === 0)" kind="people" :title="t('home.dash.noChildren')" :hint="isParent ? t('home.dash.noChildrenParent') : t('home.dash.noChildrenHint')">
                <AppButton v-if="isParent" variant="secondary" to="/family/add" icon="user-plus">{{ t('family.index.addChild') }}</AppButton>
            </AppEmpty>
        </div>
        <RelativeHomeFeed v-if="!isParent && flow.families.length > 0" show-children />
        <div v-if="(isParent || flow.families.length === 0) && visibleBookSections.length > 0" class="home__sections">
            <section v-for="section in visibleBookSections" :key="section.id" class="stack home__panel">
                <NuxtLink :to="`/library?status=${section.status}`" class="home__section-link">
                    <h2 class="subtitle grow">{{ t(section.title) }}</h2><AppBadge>{{ section.books.length }}</AppBadge><AppIcon name="chevron-right" :size="24" class="mirror-rtl" />
                </NuxtLink>
                <AdultBookTaskList v-if="section.books.length > 0" :books="section.books.slice(0, 2)" :mode="section.mode" />
            </section>
        </div>
        <section class="stack home__panel">
            <NuxtLink to="/library" class="home__section-link" data-testid="home-card-library"><h2 class="subtitle grow">{{ t('home.dash.library') }}</h2><AppBadge>{{ books.length }}</AppBadge><AppIcon name="chevron-right" :size="24" class="mirror-rtl" /></NuxtLink>
            <div class="grid grid--books home__library"><BookCard v-for="book in books.slice(0, 4)" :key="book.id" :book="book" show-status /></div>
            <AppEmpty v-if="isLoaded && books.length === 0" kind="library" :title="t('home.empty')" :hint="t('home.emptyHint')" />
        </section>
        <nav v-if="taskCards.length > 0" class="home__shortcuts" :aria-label="t('home.dash.actions')">
            <NuxtLink v-for="card in taskCards" :key="card.id" :to="card.to" class="home__shortcut" :data-testid="`home-card-${card.id}`"><AppIcon :name="card.icon" :size="20" /><span>{{ t(card.label) }}</span><span v-if="card.count !== null" class="home__count" :data-testid="`home-count-${card.id}`">{{ card.count }}</span></NuxtLink>
        </nav>
    </div>
</template>

<script setup lang="ts">
const { isEvening } = useLocalGreeting()
interface IHomeCard {
    id: string
    to: string
    icon: IconName
    label: string
    count: number | null
}

const { t } = useI18n()
const { currentId, current, isParent } = useCurrentMember()
const { children, ensureLoaded } = useMembers()
const { messages, load: loadMessages, startPolling, stopPolling } = useMessages()
const { request } = useApi()
const { books, load: loadBooks } = useBooks()
const { flow, load: loadFlow } = useRelativeFlow()
const loadError = ref('')
const taskCards = computed(() => cards.value.filter(card => card.id !== 'new-book' && card.id !== 'library' && (card.count ?? 0) > 0))
const featuredBook = computed(() => books.value.find(book => book.status === 'to_record' || book.status === 'in_review' || book.status === 'draft') ?? books.value[0] ?? null)
const bookSections = computed(() => [
    { id: 'to-record', title: 'relative.requests', mode: 'record' as const, status: 'to_record', books: books.value.filter(book => book.status === 'to_record') },
    { id: 'proposals', title: 'homeBar.cards.proposalsWaiting', mode: 'propose' as const, status: 'proposed', books: books.value.filter(book => book.status === 'proposed') },
    { id: 'review', title: 'home.dash.toReview', mode: 'review' as const, status: 'in_review', books: books.value.filter(book => book.status === 'in_review' || book.submittedCount > 0) },
    { id: 'fix', title: 'relative.fixes', mode: 'correct' as const, status: 'to_record', books: books.value.filter(book => book.changesRequestedCount > 0) },
])

const visibleBookSections = computed(() => bookSections.value
    .map(section => ({ ...section, books: section.books.filter(book => book.id !== featuredBook.value?.id) }))
    .filter(section => section.books.length > 0))

const isLoaded = ref(false)
const counts = ref<IHomeCounts | null>(null)

const isLive = (message: IMessage): boolean => message.status === 'ACTIVE' && (message.expiresAt === null || new Date(message.expiresAt).getTime() > Date.now()) && !message.isSaved

const kids = computed(() => children.value.filter(member => member.status === 'active'))

const liveCounts = computed<Record<string, number>>(() =>
    Object.fromEntries(
        kids.value.map(member => [
            member.id,
            messages.value.filter(message => message.fromMemberId === currentId.value && message.toMemberId === member.id && isLive(message)).length,
        ]),
    ),
)

const cards = computed<IHomeCard[]>(() => {
    const value = counts.value
    if (isParent.value) {
        return [
            { id: 'new-book', to: '/books/new', icon: 'book-plus', label: 'home.dash.newBook', count: null },
            { id: 'library', to: '/library', icon: 'book', label: 'home.dash.library', count: null },
            { id: 'proposals', to: '/library?status=proposed', icon: 'send', label: 'homeBar.cards.proposalsWaiting', count: value?.proposals ?? 0 },
            { id: 'drafts', to: '/library?status=draft', icon: 'pencil', label: 'homeBar.cards.started', count: value?.drafts ?? 0 },
            { id: 'to-record', to: '/library?status=to_record', icon: 'mic', label: 'homeBar.cards.toRecord', count: value?.toRecord ?? 0 },
            { id: 'recorded', to: '/library?status=ready', icon: 'check', label: 'homeBar.cards.recorded', count: value?.recorded ?? 0 },
            { id: 'review', to: '/library?status=in_review', icon: 'redo', label: 'homeBar.cards.toReview', count: value?.inReview ?? 0 },
            { id: 'trash', to: '/family/trash', icon: 'trash', label: 'homeBar.cards.trash', count: value?.trash ?? 0 },
        ]
    }
    return [
        { id: 'new-book', to: '/books/new', icon: 'book-plus', label: 'home.dash.proposeBook', count: null },
        { id: 'library', to: '/library', icon: 'book', label: 'home.dash.library', count: null },
        { id: 'proposed', to: '/categories/proposals', icon: 'book-plus', label: 'homeBar.cards.proposedByMe', count: value?.proposedByMe ?? 0 },
        { id: 'requests', to: '/categories/toRecord', icon: 'mic', label: 'homeBar.cards.requested', count: value?.requests ?? 0 },
        { id: 'proposals', to: '/categories/proposals', icon: 'send', label: 'homeBar.cards.proposalsWaiting', count: value?.proposalsWaiting ?? 0 },
        { id: 'fix', to: '/categories/toFix', icon: 'redo', label: 'homeBar.cards.toFix', count: value?.toFix ?? 0 },
    ]
})

const loadCounts = async (): Promise<void> => {
    counts.value = await request<IHomeCounts>('/home/counts')
}

onMounted(async () => {
    try {
        await Promise.all([ensureLoaded(), loadMessages(), loadCounts(), loadBooks(), isParent.value ? Promise.resolve() : loadFlow()])
        isLoaded.value = true
        startPolling()
    } catch (error) {
        console.error('Impossible de charger l’accueil', error)
        loadError.value = t('relative.loadFailed')
    }
})

onBeforeUnmount(stopPolling)
</script>

<style scoped>
.home {
    gap: 32px;
}

.home__overview {
    display: grid;
    gap: 24px;
    align-items: start;
}

.home__family :deep(.kids__list) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.home__family :deep(.kid) { padding: 12px 8px; border-width: 1px; box-shadow: none; background: transparent; }
.home__family :deep(.kid__photo) { padding: 3px; border-width: 3px; }
.home__family :deep(.kid__photo .avatar) { width: clamp(56px, 8vw, 80px) !important; height: clamp(56px, 8vw, 80px) !important; }
.home__family :deep(.kid__photo--all) { width: 80px; height: 80px; }
.home__family :deep(.kid__name) { font-size: 1.0625rem; }

@media (min-width: 1000px) {
    .home__overview:has(.home__family) { grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); }
}

.home__intro {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: start;
    gap: 16px;
}

.home__greeting {
    grid-column: 1 / -1;
    min-width: 0;
}

.home__intro :deep(.btn) {
    min-width: 0;
    width: 100%;
}

@media (max-width: 599px) {
    .home__intro {
        grid-template-columns: minmax(0, 1fr);
    }
}

.home__subtitle {
    margin: 0;
    color: var(--ink-soft);
    font-size: 1.125rem;
}

.home__sections {
    display: grid;
    gap: 28px;
}

.home__section-link {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 48px;
    color: inherit;
    text-decoration: none;
}

.home__library {
    grid-template-columns: repeat(2, minmax(0, 1fr));
}

.home__shortcuts {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    padding-top: 20px;
    border-top: 2px solid var(--grey-line);
}

.home__shortcut {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 48px;
    padding: 8px 12px;
    border: 2px solid var(--ink);
    border-radius: 24px;
    color: inherit;
    background: var(--paper);
    text-decoration: none;
    font-size: 0.9375rem;
}

.home__count {
    display: inline-grid;
    place-items: center;
    min-width: 28px;
    min-height: 28px;
    border-radius: 50%;
    background: var(--yellow);
    color: var(--on-accent);
    font-weight: 700;
}

@media (min-width: 1100px) {
    .home__sections {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .home__library {
        grid-template-columns: repeat(4, minmax(0, 1fr));
    }
}
</style>
