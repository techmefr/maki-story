<template>
    <div class="stack center screen" :class="{ kid: isChild }" :style="{ background: sender ? memberHexLight(sender) : '#FFF4D9' }">
        <template v-if="message && sender && (isStarted || !wasHeard)">
            <AppAvatar :member="sender" :size="140" />
            <h1 class="title">{{ sender.name }}</h1>
            <WaveBars :is-active="isPlaying" color="#1F1B3A" />
            <div class="progress" style="width: 100%"><div class="progress__fill" :style="{ width: percent, background: '#1F1B3A' }" /></div>
            <template v-if="isEnded">
                <div class="subtitle">C’est fini</div>
                <NuxtLink
                    v-if="nextMessage"
                    :to="`/message/listen/${nextMessage.id}`"
                    class="btn btn--mint btn--block"
                    style="min-height: 72px; font-size: 1.375rem"
                    data-focus-default
                >
                    <AppIcon name="volume" :size="32" motion="pulse" />
                    {{ nextLabel }}
                </NuxtLink>
                <NuxtLink :to="replyPath" class="btn btn--block" style="min-height: 72px; font-size: 1.375rem"><AppIcon name="mic" :size="32" motion="wiggle" />Répondre</NuxtLink>
            </template>
            <button v-else-if="!isStarted" type="button" class="btn btn--block" style="min-height: 72px; font-size: 1.375rem" data-focus-default @click="play">
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
definePageMeta({ layout: 'blank', key: route => route.fullPath })

const route = useRoute()
const { getById } = useMembers()
const { current, currentId, isChild } = useCurrentMember()
const { messages, load, markListened, queueFrom } = useMessages()
const player = useAudioPlayer()

const isStarted = ref(false)
const isEnded = ref(false)
const isMissing = ref(false)
const wasHeard = ref(false)

const message = computed(() => messages.value.find(item => item.id === String(route.params.id)) ?? null)
const sender = computed(() => getById(message.value?.fromMemberId ?? null))
const isPlaying = computed(() => player.isPlaying.value)
const canReplay = computed(() => current.value?.role === 'parent')
const backPath = computed(() => (isChild.value ? '/kid' : '/messages'))
const replyPath = computed(() => `/message/${message.value?.fromMemberId}?reply=1`)
const waiting = computed(() => {
    const heard = message.value
    return heard && currentId.value ? queueFrom(heard.fromMemberId, currentId.value).filter(item => item.id !== heard.id) : []
})
const nextMessage = computed(() => waiting.value[0] ?? null)
const nextLabel = computed(() => (waiting.value.length > 1 ? `Message suivant (${waiting.value.length} en attente)` : 'Message suivant'))
const percent = computed(() => {
    const total = message.value?.durationMs ?? 0
    return total > 0 ? `${Math.min(100, Math.round((player.positionMs.value / total) * 100))}%` : '0%'
})

const play = async (): Promise<void> => {
    if (!message.value || (message.value.listenedAt && !canReplay.value)) {
        return
    }
    const target = message.value
    player.unlock()
    isStarted.value = true
    const isOk = await player.play(target.fileId)
    if (!isOk) {
        isStarted.value = false
    }
}

player.onEnded(async () => {
    const heard = message.value
    if (heard && !heard.listenedAt) {
        try {
            await markListened(heard.id)
        } catch (error) {
            console.error('Le message n a pas pu être marqué comme écouté', error)
        }
    }
    isEnded.value = true
})

onMounted(async () => {
    await load()
    const heard = message.value
    const head = heard && currentId.value ? queueFrom(heard.fromMemberId, currentId.value)[0] : null
    if (isChild.value && heard && !heard.listenedAt && head && head.id !== heard.id) {
        await navigateTo(`/message/listen/${head.id}`, { replace: true })
        return
    }
    wasHeard.value = message.value?.listenedAt != null && !canReplay.value
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
    justify-content: safe center;
    overflow-y: auto;
    padding: 16px;
}
</style>
