<template>
    <div class="stack center screen" :style="{ background: sender ? memberHexLight(sender) : '#FFF4D9' }">
        <template v-if="message && sender && (isStarted || !wasHeard)">
            <AppAvatar :member="sender" :size="140" />
            <h1 class="title">{{ sender.name }}</h1>
            <WaveBars :is-active="isPlaying" color="#1F1B3A" />
            <div class="progress" style="width: 100%"><div class="progress__fill" :style="{ width: percent, background: '#1F1B3A' }" /></div>
            <template v-if="isEnded">
                <div class="subtitle">C’est fini</div>
                <NuxtLink :to="replyPath" class="btn btn--block" style="min-height: 72px; font-size: 22px"><AppIcon name="mic" :size="32" motion="wiggle" />Répondre</NuxtLink>
            </template>
            <button v-else-if="!isStarted" type="button" class="btn btn--block" style="min-height: 72px; font-size: 22px" @click="play">
                <AppIcon name="play" :size="32" motion="pulse" />
                Écouter
            </button>
        </template>
        <template v-else-if="isMissing">
            <AppMaki :size="100" />
            <div class="subtitle">Ce message a déjà été écouté</div>
        </template>
        <NuxtLink :to="backPath" class="btn btn--white btn--small"><AppIcon name="close" :size="18" />Fermer</NuxtLink>
    </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'blank' })

const route = useRoute()
const { getById } = useMembers()
const { isChild } = useCurrentMember()
const { messages, load, markListened } = useMessages()
const player = useAudioPlayer()

const isStarted = ref(false)
const isEnded = ref(false)
const isMissing = ref(false)
const wasHeard = ref(false)

const message = computed(() => messages.value.find(item => item.id === String(route.params.id)) ?? null)
const sender = computed(() => getById(message.value?.fromMemberId ?? null))
const isPlaying = computed(() => player.isPlaying.value)
const backPath = computed(() => (isChild.value ? '/kid' : '/messages'))
const replyPath = computed(() => `/message/${message.value?.fromMemberId}?reply=1`)
const percent = computed(() => {
    const total = message.value?.durationMs ?? 0
    return total > 0 ? `${Math.min(100, Math.round((player.positionMs.value / total) * 100))}%` : '0%'
})

const play = async (): Promise<void> => {
    if (!message.value || message.value.listenedAt) {
        return
    }
    const current = message.value
    player.unlock()
    isStarted.value = true
    const isOk = await player.play(current.fileId)
    if (isOk) {
        await markListened(current.id)
        return
    }
    isStarted.value = false
}

player.onEnded(() => {
    isEnded.value = true
})

onMounted(async () => {
    await load()
    wasHeard.value = message.value?.listenedAt != null
    if (!message.value || wasHeard.value) {
        isMissing.value = true
    }
})
</script>

<style scoped>
.screen {
    position: fixed;
    inset: 0;
    z-index: 40;
    justify-content: center;
    padding: 16px;
}
</style>
