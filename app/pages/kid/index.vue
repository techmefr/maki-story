<template>
    <div class="stack">
        <h1 class="title">Coucou {{ current?.name }} !</h1>
        <div class="faces">
            <div v-for="face in faces" :key="face.member.id" class="face">
                <NuxtLink :to="`/kid/${face.member.id}`" class="face__link">
                    <AppAvatar :member="face.member" :size="124" />
                    <span class="subtitle">{{ face.member.name }}</span>
                </NuxtLink>
                <NuxtLink
                    v-if="face.message"
                    :to="`/message/listen/${face.message.id}`"
                    class="face__bubble anim-bounce"
                    :style="{ background: face.hex }"
                >
                    Message
                </NuxtLink>
            </div>
        </div>
        <NuxtLink to="/kid/library" class="card card--tap stack center" style="color: inherit; text-decoration: none; gap: 8px">
            <span class="subtitle">Histoires à plusieurs voix</span>
            <VoiceDots :member-ids="faceIds" />
        </NuxtLink>
    </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'kid' })

const { current, currentId } = useCurrentMember()
const { grownUps } = useMembers()
const { load, startPolling, stopPolling, playableFrom } = useMessages()

const faces = computed(() =>
    grownUps.value.map(member => ({
        member,
        hex: memberHex(member),
        message: currentId.value ? playableFrom(member.id, currentId.value) : null,
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
.faces {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 18px 12px;
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
}

.face__bubble {
    position: absolute;
    top: -6px;
    right: 6px;
    border: 2.5px solid var(--ink);
    border-radius: 999px;
    padding: 8px 14px;
    font: 700 15px/1 var(--font-title);
    color: var(--ink);
    text-decoration: none;
    box-shadow: var(--shadow);
}
</style>
