<template>
    <div class="stack home">
        <StatusStrip v-if="isParent" />
        <h1 class="title">{{ t('home.dash.myChildren') }}</h1>
        <GrimaceNudge />
        <BirthDateNudge />
        <BookSearchEntry />
        <ul v-if="kids.length > 0" class="home__kids" role="list" data-testid="relatives-grid">
            <li v-for="(kid, index) in kids" :key="kid.member.id" class="pop-in" :style="{ '--i': index }">
                <NuxtLink :to="`/message/${kid.member.id}`" class="card card--tap home__kid" :aria-label="t('home.dash.messageTo', { name: kid.member.name })" :data-testid="`home-kid-${kid.member.id}`">
                    <span class="home__photo" :style="{ '--ring': memberHex(kid.member) }"><AppAvatar :member="kid.member" :size="96" /></span>
                    <span class="subtitle home__name">{{ kid.member.name }}</span>
                    <AppBadge :tone="kid.isFull ? 'warning' : undefined">{{ t('home.dash.quota', { count: kid.count, max: MESSAGE_MAX_ACTIVE }) }}</AppBadge>
                    <span class="home__send"><AppIcon name="mic" :size="18" />{{ t('home.dash.message') }}</span>
                </NuxtLink>
            </li>
        </ul>
        <AppEmpty v-else-if="isLoaded" kind="people" :title="t('home.dash.noChildren')" :hint="isParent ? t('home.dash.noChildrenParent') : t('home.dash.noChildrenHint')">
            <AppButton v-if="isParent" variant="secondary" to="/family/add" icon="user-plus">{{ t('family.index.addChild') }}</AppButton>
        </AppEmpty>
        <section class="stack" aria-labelledby="home-actions">
            <h2 id="home-actions" class="subtitle">{{ t('home.dash.actions') }}</h2>
            <ul class="home__actions">
                <li v-for="action in actions" :key="action.to">
                    <AppListRow :to="action.to" :title="t(action.label)" :subtitle="t(action.hint)" :data-testid="action.testId">
                        <template #lead><span class="home__action-icon"><AppIcon :name="action.icon" :size="24" /></span></template>
                        <template v-if="action.count > 0" #action><AppBadge tone="warning">{{ action.count }}</AppBadge></template>
                        <template v-else #action><AppIcon name="chevron-right" :size="22" class="mirror-rtl" /></template>
                    </AppListRow>
                </li>
            </ul>
        </section>
    </div>
</template>

<script setup lang="ts">
interface IHomeAction {
    to: string
    icon: IconName
    label: string
    hint: string
    count: number
    testId: string
}

const { t } = useI18n()
const { currentId, isParent } = useCurrentMember()
const { children, ensureLoaded } = useMembers()
const { messages, load: loadMessages, startPolling, stopPolling } = useMessages()
const { books, load: loadBooks } = useBooks()
const { flow, load: loadFlow } = useRelativeFlow()

const isLoaded = ref(false)

const isLive = (message: IMessage): boolean => message.status === 'ACTIVE' && (message.expiresAt === null || new Date(message.expiresAt).getTime() > Date.now()) && !message.isSaved

const kids = computed(() =>
    children.value
        .filter(member => member.status === 'active')
        .map(member => {
            const count = messages.value.filter(message => message.fromMemberId === currentId.value && message.toMemberId === member.id && isLive(message)).length
            return { member, count, isFull: count >= MESSAGE_MAX_ACTIVE }
        }),
)

const family = computed(() => flow.value.families.find(item => item.familyId === flow.value.currentFamilyId) ?? null)
const toReview = computed<number>(() => books.value.filter(book => book.submittedCount > 0).length)

const actions = computed<IHomeAction[]>(() => {
    if (isParent.value) {
        return [
            { to: '/books/new', icon: 'book-plus', label: 'home.dash.newBook', hint: 'home.dash.newBookHint', count: 0, testId: 'home-new-book' },
            { to: '/books/isbn', icon: 'search', label: 'home.dash.byIsbn', hint: 'home.dash.byIsbnHint', count: 0, testId: 'home-isbn' },
            { to: '/library?status=in_review', icon: 'check', label: 'home.dash.toReview', hint: 'home.dash.toReviewHint', count: toReview.value, testId: 'home-review' },
            { to: '/library', icon: 'book', label: 'home.dash.library', hint: 'home.dash.libraryHint', count: 0, testId: 'home-library' },
            { to: '/family', icon: 'users', label: 'home.dash.manageFamily', hint: 'home.dash.manageFamilyHint', count: 0, testId: 'home-family' },
        ]
    }
    return [
        { to: '/books/new', icon: 'book-plus', label: 'home.dash.proposeBook', hint: 'home.dash.proposeBookHint', count: 0, testId: 'home-propose' },
        { to: '/categories/toRecord', icon: 'mic', label: 'home.dash.requests', hint: 'home.dash.requestsHint', count: family.value?.requests.length ?? 0, testId: 'home-requests' },
        { to: '/categories/proposals', icon: 'send', label: 'home.dash.pending', hint: 'home.dash.pendingHint', count: family.value?.proposals.length ?? 0, testId: 'home-pending' },
        { to: '/categories/toFix', icon: 'redo', label: 'home.dash.toFix', hint: 'home.dash.toFixHint', count: family.value?.fixes.length ?? 0, testId: 'home-fix' },
        { to: '/library', icon: 'book', label: 'home.dash.library', hint: 'home.dash.libraryHint', count: 0, testId: 'home-library' },
        { to: '/vault', icon: 'chest', label: 'vault.open', hint: 'home.dash.vaultHint', count: 0, testId: 'home-vault' },
    ]
})

onMounted(async () => {
    await Promise.all([ensureLoaded(), loadMessages(), isParent.value ? loadBooks() : loadFlow()])
    isLoaded.value = true
    startPolling()
})

onBeforeUnmount(stopPolling)
</script>

<style scoped>
.home__kids {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
    margin: 0;
    padding: 0;
    list-style: none;
}

@media (min-width: 720px) {
    .home__kids {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }
}

@media (min-width: 1100px) {
    .home__kids {
        grid-template-columns: repeat(4, minmax(0, 1fr));
    }
}

.home__kid {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    min-height: 200px;
    text-align: center;
    color: inherit;
    text-decoration: none;
    overflow-wrap: anywhere;
}

.home__photo {
    display: inline-flex;
    padding: 4px;
    border: 5px solid var(--ring);
    border-radius: 50%;
}

.home__name {
    max-width: 100%;
}

.home__send {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--ink-soft);
    font: 700 0.9375rem/1 var(--font-title);
}

.home__actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin: 0;
    padding: 0;
    list-style: none;
}

.home__action-icon {
    display: flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border: var(--outline) solid var(--ink);
    border-radius: 50%;
    background: var(--sky);
    color: var(--on-accent);
}
</style>
