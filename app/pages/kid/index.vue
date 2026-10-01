<template>
    <div class="stack">
        <div class="row hello">
            <AppMaki :size="64" class="anim-float" />
            <h1 class="title">Coucou {{ current?.name }} !</h1>
        </div>
        <GrimaceNudge />
        <div class="faces">
            <div v-for="(face, index) in faces" :key="face.member.id" class="face pop-in" :style="{ '--i': index }">
                <NuxtLink :to="`/kid/${face.member.id}`" class="face__link">
                    <AppAvatar :member="face.member" :size="124" />
                    <span class="subtitle">{{ face.member.name }}</span>
                </NuxtLink>
                <NuxtLink
                    v-if="face.message"
                    :to="`/message/listen/${face.message.id}`"
                    class="face__bubble anim-bounce"
                    :style="{ background: face.hex }"
                    :aria-label="face.bubbleLabel"
                >
                    <AppIcon name="message-heart" :size="22" motion="wiggle" />
                    Message
                    <span class="face__count" data-bubble-count>{{ face.count }}</span>
                </NuxtLink>
            </div>
        </div>
        <AppEmpty v-if="faces.length === 0" title="Personne n’est encore là" hint="Demande à un grand d’ajouter la famille." />
        <NuxtLink to="/kid/library" class="card card--tap stack center" style="color: inherit; text-decoration: none; gap: 8px">
            <AppIcon name="book" :size="44" motion="float" />
            <span class="subtitle">Histoires à plusieurs voix</span>
            <VoiceDots :member-ids="faceIds" />
        </NuxtLink>
    </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'kid' })

const { current, currentId } = useCurrentMember()
const { grownUps } = useMembers()
const { load, startPolling, stopPolling, playableFrom, unreadFrom } = useMessages()

const faces = computed(() =>
    grownUps.value.map(member => ({
        member,
        hex: memberHex(member),
        message: currentId.value ? playableFrom(member.id, currentId.value) : null,
        count: currentId.value ? unreadFrom(member.id, currentId.value) : 0,
        bubbleLabel: `${member.name} : ${currentId.value ? unreadFrom(member.id, currentId.value) : 0} à écouter`,
    })),
)
const faceIds = computed(() => grownUps.value.map(member => member.id))

onMounted(async () => {
    await load()
    startPolling()
})

onBeforeUnmount(stopPolling)
</script>

<style scoped>
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
    right: 6px;
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
