<template>
    <div class="stack kid-home">
        <section class="kid-home__welcome" aria-labelledby="kid-home-title">
            <div class="stack">
                <h1 id="kid-home-title" class="title">{{ t('kid.hello', { name: current?.name ?? '' }) }}</h1>
                <p v-if="faces.length > 0" class="kid-home__hint">{{ t('kid.pickHint') }}</p>
            </div>
            <MakiScene pose="hello" :size="144" />
        </section>
        <div class="faces">
            <div v-for="(face, index) in faces" :key="face.member.id" class="face pop-in" :style="{ '--i': index }">
                <NuxtLink :to="face.target" class="face__link" :aria-label="face.label" :data-ring="face.ring">
                    <span class="face__ring" :class="`face__ring--${face.ring}`" :style="{ '--ring': face.hex }">
                        <AppAvatar :member="face.member" :size="104" />
                    </span>
                    <span class="subtitle">{{ face.member.name }}</span>
                    <span class="face__quota">{{ t('kid.quota', { count: formatNumber(face.count), max: formatNumber(MESSAGE_MAX_ACTIVE) }) }}</span>
                </NuxtLink>
                <MessageBubbleLink
                    v-if="face.message && face.count > 0"
                    variant="kid"
                    :message-id="face.message.id"
                    :kind="face.message.kind"
                    :count="face.count"
                    :name="face.member.name"
                    :color="face.hex"
                />
            </div>
        </div>
        <LazyBirthdayParty v-if="isPartyOpen && current" :name="current.name" :age="partyAge" @close="closeParty" />
        <AppEmpty kind="people" v-if="faces.length === 0" :title="t('kid.noFaces')" :hint="t('kid.noFacesHint')" />
    </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'kid' })

const { t, formatNumber } = useI18n()
const { current, currentId } = useCurrentMember()
const { grownUps, load: loadMembers } = useMembers()
const { request } = useApi()
const { load, startPolling, stopPolling, playableFrom, unreadFrom } = useMessages()

const faces = computed(() =>
    grownUps.value.map(member => {
        const message = currentId.value ? playableFrom(member.id, currentId.value) : null
        const count = currentId.value ? unreadFrom(member.id, currentId.value) : 0
        return {
        member,
        hex: memberHex(member),
        message,
        count,
        ring: message ? (count > 0 ? 'unheard' : 'heard') : 'none',
        target: `/kid/${member.id}`,
        label: message ? t('homeCards.bubbleLabel', { name: member.name, count }) : member.name,
        }
    }),
)
const deviceTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
const isPartyOpen = ref(false)
const partyAge = computed(() => (current.value?.birthDate ? computeAge(current.value.birthDate, deviceTimeZone) : 0))

const closeParty = async (): Promise<void> => {
    isPartyOpen.value = false
    if (!current.value) {
        return
    }
    try {
        await request(`/members/${current.value.id}/birthday-celebrated`, { method: 'POST', body: { year: new Date().getFullYear() } })
        await loadMembers()
    } catch (error) {
        console.error('Impossible d’enregistrer l’anniversaire pour le moment', error)
    }
}

onMounted(async () => {
    await load()
    startPolling()
    const birthDate = current.value?.birthDate
    isPartyOpen.value =
        current.value?.role === 'child' &&
        !!birthDate &&
        isBirthdayToday(birthDate, deviceTimeZone) &&
        current.value.birthdayCelebratedYear !== new Date().getFullYear()
})

onBeforeUnmount(stopPolling)
</script>

<style scoped>
.kid-home {
    gap: 28px;
}

.kid-home__welcome {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 16px;
    padding: 20px;
    border: var(--outline) solid var(--ink);
    border-radius: 28px;
    background: var(--sky);
    color: var(--on-accent);
    box-shadow: var(--shadow);
}

.kid-home__hint {
    margin: 0;
    font-size: 1.125rem;
}

@media (max-width: 599px) {
    .kid-home__welcome :deep(.scene) {
        width: 88px;
    }
}

.face__ring {
    display: inline-flex;
    padding: 6px;
    border: 5px solid transparent;
    border-radius: 50%;
}

.face__ring--unheard {
    border-color: var(--ring);
    animation: ring-glow 1.8s ease-in-out infinite;
}

.face__ring--heard {
    border-color: var(--grey-line);
}

@keyframes ring-glow {
    0%,
    100% {
        box-shadow: 0 0 0 0 transparent;
    }
    50% {
        box-shadow: 0 0 0 6px color-mix(in srgb, var(--ring) 35%, transparent);
    }
}

@media (prefers-reduced-motion: reduce) {
    .face__ring--unheard {
        animation: none;
    }
}

.face__quota {
    color: var(--ink-soft);
    font: 600 0.9375rem/1.2 var(--font-body);
}

.faces {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 24px 16px;
}

@media (min-width: 720px) {
    .faces {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }
}

@media (min-width: 1300px) {
    .faces {
        grid-template-columns: repeat(4, minmax(0, 1fr));
    }
}

@media (max-width: 389px) {
    .face__link {
        padding-inline: 4px;
    }

    .face__ring :deep(.avatar) {
        width: 88px !important;
        height: 88px !important;
    }
}

.face {
    position: relative;
    display: flex;
    min-width: 0;
    justify-content: center;
}

.face__link {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    width: 100%;
    min-width: 0;
    padding: 20px 12px;
    border: var(--outline) solid var(--ink);
    border-radius: 28px;
    background: var(--paper);
    box-shadow: var(--shadow);
    color: inherit;
    text-decoration: none;
    max-width: 100%;
    text-align: center;
    overflow-wrap: anywhere;
}
</style>
