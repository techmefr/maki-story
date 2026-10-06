<template>
    <div class="stack home">
        <StatusStrip v-if="isParent" />
        <HomeChildrenBar v-if="kids.length > 0" :kids="kids" :counts="liveCounts" @sent="loadMessages" />
        <AppEmpty v-else-if="isLoaded" kind="people" :title="t('home.dash.noChildren')" :hint="isParent ? t('home.dash.noChildrenParent') : t('home.dash.noChildrenHint')">
            <AppButton v-if="isParent" variant="secondary" to="/family/add" icon="user-plus">{{ t('family.index.addChild') }}</AppButton>
        </AppEmpty>
        <section class="stack" aria-labelledby="home-dashboard">
            <h2 id="home-dashboard" class="subtitle">{{ t('home.dash.actions') }}</h2>
            <ul class="home__cards" role="list">
                <li v-for="card in cards" :key="card.id">
                    <NuxtLink :to="card.to" class="card card--tap home__card" :data-testid="`home-card-${card.id}`">
                        <span class="home__icon"><AppIcon :name="card.icon" :size="24" /></span>
                        <span v-if="card.count !== null" class="home__count" :data-testid="`home-count-${card.id}`">{{ card.count }}</span>
                        <span class="home__label">{{ t(card.label) }}</span>
                    </NuxtLink>
                </li>
            </ul>
        </section>
    </div>
</template>

<script setup lang="ts">
interface IHomeCard {
    id: string
    to: string
    icon: IconName
    label: string
    count: number | null
}

const { t } = useI18n()
const { currentId, isParent } = useCurrentMember()
const { children, ensureLoaded } = useMembers()
const { messages, load: loadMessages, startPolling, stopPolling } = useMessages()
const { request } = useApi()

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
    await Promise.all([ensureLoaded(), loadMessages(), loadCounts()])
    isLoaded.value = true
    startPolling()
})

onBeforeUnmount(stopPolling)
</script>

<style scoped>
.home__cards {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
    margin: 0;
    padding: 0;
    list-style: none;
}

@media (min-width: 720px) {
    .home__cards {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }
}

.home__card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    text-align: center;
    color: inherit;
    text-decoration: none;
    overflow-wrap: anywhere;
}

.home__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border: var(--outline) solid var(--ink);
    border-radius: 50%;
    background: var(--sky);
    color: var(--on-accent);
}

.home__count {
    font: 800 2rem/1 var(--font-title);
}

.home__label {
    font: 700 0.9375rem/1.2 var(--font-title);
}
</style>
