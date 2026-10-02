<template>
    <div class="stack">
        <div class="row hello">
            <h1 class="title grow">{{ t('kid.hello', { name: current?.name ?? '' }) }}</h1>
            <AppButton variant="secondary" is-round to="/kid/treasure" :aria-label="t('kid.treasure.open')" data-testid="treasure-chest">
                <AppIcon name="chest" :size="34" motion="float" />
            </AppButton>
        </div>
        <GrimaceNudge />
        <BookSearchEntry />
        <div class="faces">
            <div v-for="(face, index) in faces" :key="face.member.id" class="face pop-in" :style="{ '--i': index }">
                <NuxtLink :to="face.target" class="face__link" :aria-label="face.label" :data-ring="face.ring">
                    <span class="face__ring" :class="`face__ring--${face.ring}`" :style="{ '--ring': face.hex }">
                        <AppAvatar :member="face.member" :size="124" />
                    </span>
                    <span class="subtitle">{{ face.member.name }}</span>
                </NuxtLink>
                <NuxtLink
                    v-if="face.message && face.count > 0"
                    :to="`/message/listen/${face.message.id}`"
                    class="face__bubble anim-bounce"
                    :class="{ 'face__bubble--birthday': face.message.kind === 'BIRTHDAY' }"
                    :style="{ background: face.hex }"
                    :aria-label="face.bubbleLabel"
                >
                    <AppIcon :name="face.message.kind === 'BIRTHDAY' ? 'party' : 'message-heart'" :size="22" motion="wiggle" />
                    {{ face.message.kind === 'BIRTHDAY' ? t('kid.birthday.bubble') : t('kid.bubble') }}
                    <span class="face__count" data-bubble-count>{{ formatNumber(face.count) }}</span>
                </NuxtLink>
            </div>
        </div>
        <LazyBirthdayParty v-if="isPartyOpen && current" :name="current.name" :age="partyAge" @close="closeParty" />
        <AppEmpty kind="people" v-if="faces.length === 0" :title="t('kid.noFaces')" :hint="t('kid.noFacesHint')" />
        <NuxtLink to="/kid/library" class="card card--tap stack center" style="color: inherit; text-decoration: none; gap: 8px">
            <AppIcon name="book" :size="44" motion="float" />
            <span class="subtitle">{{ t('kid.multiVoice') }}</span>
            <VoiceDots :member-ids="faceIds" />
        </NuxtLink>
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
        target: message ? `/message/listen/${message.id}` : `/kid/${member.id}`,
        label: message ? t('kid.bubbleLabel', { name: member.name, count }) : member.name,
        bubbleLabel: t('kid.bubbleLabel', { name: member.name, count }),
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

const faceIds = computed(() => grownUps.value.map(member => member.id))

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
.face__bubble--birthday {
    outline: 3px dashed var(--ink);
    outline-offset: 2px;
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
    border-color: #b8b5c4;
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

.face__count {
    min-width: 26px;
    height: 26px;
    border-radius: 999px;
    border: 2.5px solid var(--ink);
    background: var(--paper);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 0.875rem;
}

.faces {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px 12px;
}

@media (min-width: 720px) {
    .faces {
        grid-template-columns: repeat(4, minmax(0, 1fr));
    }
}

.face {
    position: relative;
    display: flex;
    justify-content: center;
}

.face__link {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    color: inherit;
    text-decoration: none;
    max-width: 100%;
    text-align: center;
    overflow-wrap: anywhere;
}

.face__bubble {
    position: absolute;
    top: -6px;
    inset-inline-end: 6px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    border: 2.5px solid var(--ink);
    border-radius: 999px;
    padding: 8px 14px;
    font: 700 0.9375rem/1 var(--font-title);
    color: var(--ink);
    text-decoration: none;
    box-shadow: var(--shadow);
}
</style>
