<template>
    <div class="stack center screen" :class="{ kid: isChild }" :style="{ background: sender ? memberHexLight(sender) : '#FFF4D9' }">
        <template v-if="message && sender">
            <AppAvatar :member="sender" :size="140" />
            <h1 class="title">{{ sender.name }}</h1>
            <WaveBars :is-active="isPlaying" color="#1F1B3A" />
            <div class="progress" style="width: 100%"><div class="progress__fill" :style="{ width: percent, background: '#1F1B3A' }" /></div>
            <template v-if="isEnded">
                <div class="subtitle">{{ t('messages.listen.finished') }}</div>
                <AppButton variant="secondary" tone="mint" is-block style="min-height: 72px; font-size: 1.375rem" data-focus-default @click="replay">
                    <AppIcon name="play" :size="32" motion="pulse" />
                    {{ t('messages.listen.again') }}
                </AppButton>
            </template>
            <AppButton is-block v-else-if="!isStarted" style="min-height: 72px; font-size: 1.375rem" data-focus-default @click="play">
                <AppIcon name="play" :size="32" motion="pulse" />
                {{ t('messages.listen.play') }}
            </AppButton>
        </template>
        <template v-else-if="isMissing">
            <AppMaki :size="100" />
            <div class="subtitle">{{ t('messages.listen.alreadyHeard') }}</div>
        </template>
        <AppButton variant="secondary" size="sm" :to="backPath"><AppIcon name="close" :size="18" />{{ t('common.close') }}</AppButton>
    </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'blank', key: route => route.fullPath })

const { t } = useI18n()
const route = useRoute()
const { getById } = useMembers()
const { currentId, isChild } = useCurrentMember()
const { messages, load, markListened } = useMessages()
const player = useAudioPlayer()

const isStarted = ref(false)
const isEnded = ref(false)
const isMissing = ref(false)

const message = computed(() => messages.value.find(item => item.id === String(route.params.id)) ?? null)
const sender = computed(() => getById(message.value?.fromMemberId ?? null))
const isPlaying = computed(() => player.isPlaying.value)
const backPath = computed(() => (isChild.value ? '/kid' : '/messages'))
const percent = computed(() => {
    const total = message.value?.durationMs ?? 0
    return total > 0 ? `${Math.min(100, Math.round((player.positionMs.value / total) * 100))}%` : '0%'
})

const replay = async (): Promise<void> => {
    await play()
}

const play = async (): Promise<void> => {
    if (!message.value) {
        return
    }
    const target = message.value
    player.unlock()
    isStarted.value = true
    isEnded.value = false
    const isOk = await player.play(target.fileId)
    if (!isOk) {
        isStarted.value = false
    }
}

player.onEnded(async () => {
    const heard = message.value
    if (heard && isChild.value && !heard.firstListenedAt) {
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
    isMissing.value = !message.value
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
