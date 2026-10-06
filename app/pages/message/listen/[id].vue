<template>
    <div
        class="stack center screen"
        :class="{ kid: isChild }"
        :style="sender ? { background: memberHexLight(sender) } : undefined"
        data-testid="message-player"
        @pointerdown="onPointerDown"
        @pointerup="onPointerUp"
    >
        <AppButton class="screen__back" variant="secondary" size="sm" :to="backPath" :aria-label="t('common.back')">
            <AppIcon name="back" :size="18" class="mirror-rtl" />{{ t('common.back') }}
        </AppButton>
        <template v-if="message && sender">
            <div class="focal">
                <AppBlob :active="isPlaying" :color="memberHex(sender)" :size="200">
                    <AppAvatar :member="sender" :size="200" />
                </AppBlob>
                <TreasureHeart v-if="canKeep" :key="message.id" class="focal__heart" :message-id="message.id" :child-id="message.toMemberId" />
            </div>
            <h1 class="focal__name">{{ sender.name }}</h1>
            <WaveBars v-if="isPlaying" :is-active="isPlaying" color="var(--ink)" />
            <AppButton
                class="btn--big"
                :wiggle="!isStarted || isEnded"
                :disabled="isPlaying"
                :aria-label="mainLabel"
                data-focus-default
                data-testid="message-toggle"
                @click="toggle"
            >
                <AppIcon :name="mainIcon" :size="48" motion="none" />
            </AppButton>
            <div
                class="progress player__progress"
                role="progressbar"
                :aria-label="t('kid.listen.progress')"
                aria-valuemin="0"
                aria-valuemax="100"
                :aria-valuenow="percentValue"
            >
                <div class="progress__fill player__fill" :style="{ width: percent }" />
            </div>
            <div v-if="queue.length > 1" class="row controls">
                <AppButton
                    variant="secondary"
                    is-round
                    :disabled="!hasPrevious"
                    :aria-label="t('messages.listen.previous')"
                    data-testid="message-previous"
                    @click="go(-1)"
                >
                    <AppIcon name="skip-back" :size="24" class="mirror-rtl" />
                </AppButton>
                <AppButton
                    variant="secondary"
                    is-round
                    :aria-label="t('messages.listen.next')"
                    data-testid="message-next"
                    @click="go(1)"
                >
                    <AppIcon name="skip-forward" :size="24" class="mirror-rtl" />
                </AppButton>
            </div>
        </template>
        <template v-else-if="isMissing">
            <AppMaki :size="100" />
            <div class="subtitle">{{ t('messages.listen.alreadyHeard') }}</div>
        </template>
    </div>
</template>

<script setup lang="ts">
const SWIPE_DISTANCE_PX = 60

definePageMeta({ layout: 'blank' })

const { t } = useI18n()
const route = useRoute()
const { getById, ensureLoaded } = useMembers()
const { currentId, isChild } = useCurrentMember()
const { messages, load, markListened, isLive } = useMessages()
const player = useAudioPlayer()

const isStarted = ref(false)
const isEnded = ref(false)
const isMissing = ref(false)
let swipeStartX: number | null = null

const messageId = computed(() => String(route.params.id))
const message = computed(() => messages.value.find(item => item.id === messageId.value) ?? null)
const sender = computed(() => getById(message.value?.fromMemberId ?? null))
const isPlaying = computed(() => player.isPlaying.value)
const backPath = computed(() => (isChild.value ? '/kid' : '/messages'))
const canKeep = computed(() => message.value !== null && (isChild.value || currentId.value !== null) && message.value.fromMemberId !== currentId.value)
const percent = computed(() => {
    const total = message.value?.durationMs ?? 0
    return total > 0 ? `${Math.min(100, Math.round((player.positionMs.value / total) * 100))}%` : '0%'
})
const percentValue = computed(() => Number.parseInt(percent.value, 10))
const mainLabel = computed<string>(() => {
    if (isEnded.value) {
        return t('messages.listen.again')
    }
    return isPlaying.value ? t('kid.listen.playing') : t('kid.listen.resumePlay')
})
const mainIcon = computed<IconName>(() => {
    if (isEnded.value) {
        return 'redo'
    }
    return isPlaying.value ? 'volume' : 'play'
})

const queue = computed(() => {
    const target = message.value?.toMemberId
    return messages.value
        .filter(item => item.toMemberId === target && isLive(item))
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
})
const position = computed(() => queue.value.findIndex(item => item.id === messageId.value))
const hasPrevious = computed(() => position.value > 0)
const hasNext = computed(() => position.value >= 0 && position.value < queue.value.length - 1)

const finish = async (): Promise<void> => {
    const from = message.value?.fromMemberId
    if (isChild.value && from) {
        await navigateTo(`/kid/${from}`)
        return
    }
    await navigateTo(backPath.value)
}

const go = async (step: number): Promise<void> => {
    const target = queue.value[position.value + step]
    if (target) {
        await navigateTo(`/message/listen/${target.id}`, { replace: true })
        return
    }
    if (step > 0) {
        await finish()
    }
}

const play = async (): Promise<void> => {
    const target = message.value
    if (!target) {
        return
    }
    player.unlock()
    isStarted.value = true
    isEnded.value = false
    const isOk = await player.play(target.fileId)
    if (!isOk) {
        isStarted.value = false
        return
    }
    if (target.toMemberId === currentId.value && !target.firstListenedAt) {
        try {
            await markListened(target.id)
        } catch (error) {
            console.error('Le message n a pas pu être marqué comme écouté', error)
        }
    }
}

const toggle = async (): Promise<void> => {
    if (isEnded.value || !isStarted.value) {
        await play()
        return
    }
    if (!isPlaying.value) {
        await player.resume()
    }
}

const onPointerDown = (event: PointerEvent): void => {
    swipeStartX = event.clientX
}

const onPointerUp = async (event: PointerEvent): Promise<void> => {
    if (swipeStartX === null) {
        return
    }
    const distance = event.clientX - swipeStartX
    swipeStartX = null
    if (Math.abs(distance) < SWIPE_DISTANCE_PX) {
        return
    }
    const isRtl = document.documentElement.dir === 'rtl'
    const isForward = isRtl ? distance > 0 : distance < 0
    await go(isForward ? 1 : -1)
}

const onKey = async (event: KeyboardEvent): Promise<void> => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
        return
    }
    const isRtl = document.documentElement.dir === 'rtl'
    const isForward = (event.key === 'ArrowRight') !== isRtl
    await go(isForward ? 1 : -1)
}

player.onEnded(async () => {
    isEnded.value = true
    if (!hasNext.value && isChild.value) {
        await finish()
        return
    }
    if (hasNext.value) {
        await go(1)
    }
})

watch(messageId, async () => {
    player.stop()
    isStarted.value = false
    isEnded.value = false
    if (message.value) {
        await play()
    }
})

onMounted(async () => {
    window.addEventListener('keydown', onKey)
    await Promise.all([ensureLoaded(), load()])
    isMissing.value = !message.value
    if (message.value) {
        await play()
    }
})

onBeforeUnmount(() => {
    window.removeEventListener('keydown', onKey)
    player.stop()
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
    touch-action: pan-y;
    background: var(--paper);
    color: var(--ink);
}

.screen__back {
    position: absolute;
    inset-block-start: 16px;
    inset-inline-start: 16px;
}

.focal {
    position: relative;
}

.focal__heart {
    position: absolute;
    inset-block-end: 0;
    inset-inline-end: 0;
}

.focal__name {
    margin: 0;
}

.player__progress {
    width: min(100%, 360px);
}

.player__fill {
    background: var(--ink);
}

.controls {
    justify-content: center;
    gap: 16px;
}
</style>
