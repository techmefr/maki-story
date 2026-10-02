<template>
    <div class="stack">
        <StatusStrip v-if="isParent" />
        <h1 class="title">{{ t('home.relatives.title') }}</h1>
        <GrimaceNudge />
        <BirthDateNudge />
        <BookSearchEntry />
        <ul v-if="cards.length > 0" class="people" role="list" data-testid="relatives-grid">
            <li v-for="(card, index) in cards" :key="card.member.id" class="pop-in" :style="{ '--i': index }">
                <NuxtLink
                    :to="card.to"
                    class="card card--tap people__card"
                    :class="`people__card--${card.ring}`"
                    :style="{ '--ring': memberHex(card.member) }"
                    :data-ring="card.ring"
                    :aria-label="card.label"
                >
                    <span class="people__ring">
                        <AppAvatar :member="card.member" :size="88" />
                    </span>
                    <span class="subtitle people__name">{{ card.member.name }}</span>
                    <span class="muted">{{ card.hint }}</span>
                </NuxtLink>
            </li>
        </ul>
        <AppEmpty
            v-else-if="isLoaded"
            kind="people"
            :title="t('home.relatives.empty')"
            :hint="isParent ? t('home.relatives.emptyHintParent') : t('home.relatives.emptyHint')"
        >
            <AppButton v-if="isParent" variant="secondary" to="/family/add"><AppIcon name="user-plus" :size="22" />{{ t('family.add.title') }}</AppButton>
        </AppEmpty>
        <AppButton variant="secondary" is-block to="/messages" data-testid="send-message">
            <AppIcon name="mic" :size="22" />{{ t('home.relatives.sendMessage') }}
        </AppButton>
        <LibraryKiosk v-if="!isParent" :has-title="false" />
    </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const { currentId, isParent } = useCurrentMember()
const { people, ensureLoaded } = useMembers()
const { messages, load: loadMessages, startPolling, stopPolling } = useMessages()

const isLoaded = ref(false)

const isLive = (expiresAt: string | null): boolean => expiresAt === null || new Date(expiresAt).getTime() > Date.now()

const cards = computed(() =>
    people.value
        .filter(member => member.role !== 'child' && member.id !== currentId.value)
        .map(member => {
            const live = messages.value.filter(message => message.fromMemberId === member.id && isLive(message.expiresAt))
            const unheard = live.filter(message => !message.firstListenedAt)
            const playable = unheard[0] ?? live[0] ?? null
            const ring = unheard.length > 0 ? 'unheard' : live.length > 0 ? 'heard' : 'none'
            return {
                member,
                ring,
                to: playable ? `/message/listen/${playable.id}` : `/kid/${member.id}`,
                hint: playable ? t('home.relatives.hasMessage') : t('home.relatives.books'),
                label: playable ? t('home.relatives.playLabel', { name: member.name }) : t('home.relatives.booksLabel', { name: member.name }),
            }
        }),
)

onMounted(async () => {
    await Promise.all([ensureLoaded(), loadMessages()])
    isLoaded.value = true
    startPolling()
})

onBeforeUnmount(stopPolling)
</script>

<style scoped>
.people {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
}

@media (min-width: 720px) {
    .people {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }
}

@media (min-width: 1100px) {
    .people {
        grid-template-columns: repeat(5, minmax(0, 1fr));
    }
}

.people__card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    min-height: 168px;
    text-align: center;
    color: inherit;
    text-decoration: none;
    overflow-wrap: anywhere;
}

.people__ring {
    display: inline-flex;
    padding: 5px;
    border-radius: 50%;
    border: 5px solid transparent;
}

.people__card--unheard .people__ring {
    border-color: var(--ring);
}

.people__card--heard .people__ring {
    border-color: var(--grey-ui);
}

.people__name {
    max-width: 100%;
}
</style>
