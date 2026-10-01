<template>
    <div class="reader" :style="{ background: readerHex }">
        <div v-if="phase === 'page'" class="reader__center stack center">
            <AppMaki :size="160" class="anim-bounce" />
            <div class="title">Page suivante</div>
            <button type="button" class="btn btn--big" aria-label="Tourner la page" @click="turnPage"><AppIcon name="next" :size="48" motion="nudge" /></button>
        </div>
        <div v-else-if="phase === 'end'" class="reader__center stack center">
            <AppMaki :size="160" />
            <div class="title">C’est fini !</div>
            <button type="button" class="btn btn--big btn--white" @click="replay"><AppIcon name="redo" :size="40" motion="spin" />Recommencer</button>
            <NuxtLink to="/kid" class="btn btn--big"><AppIcon name="home" :size="40" />Retour</NuxtLink>
        </div>
        <div v-else-if="phase === 'loading'" class="reader__center stack center">
            <AppMaki :size="120" class="anim-pulse" />
        </div>
        <div v-else-if="phase === 'ready'" class="reader__center stack center">
            <AppMaki :size="160" />
            <button type="button" class="btn btn--big" aria-label="Lire" @click="start"><AppIcon name="play" :size="56" motion="pulse" /></button>
        </div>
        <div v-else class="reader__center stack center" :class="{ reader__flash: isCueFlashing }">
            <AppBlob :active="isPlaying" :color="readerAccent" :size="200">
                <AppAvatar :member="reader" :size="200" />
            </AppBlob>
            <div class="title">{{ reader?.name }} lit</div>
            <button type="button" class="btn btn--big btn--white" :aria-label="isPlaying ? 'Pause' : 'Lecture'" @click="togglePause">
                <AppIcon :name="isPlaying ? 'pause' : 'play'" :size="48" />
            </button>
        </div>
        <div class="reader__bottom">
            <div class="progress"><div class="progress__fill" :style="{ width: progressPercent, background: '#1F1B3A' }" /></div>
            <div class="row" style="justify-content: space-between">
                <NuxtLink to="/kid" class="btn btn--small btn--white"><AppIcon name="close" :size="18" />Quitter</NuxtLink>
                <button type="button" class="btn btn--small btn--white" :aria-pressed="isSoundOn" @click="toggleSound">
                    <AppIcon :name="isSoundOn ? 'volume' : 'mute'" :size="18" />{{ isSoundOn ? 'Son' : 'Sans son' }}
                </button>
                <span class="badge">Page {{ pageNumber }}/{{ pageTotal }}</span>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
type Phase = 'loading' | 'ready' | 'playing' | 'page' | 'end'

definePageMeta({ layout: 'blank' })

const route = useRoute()
const { get } = useBooks()
const { getById } = useMembers()
const { ding, unlock, panelCue, isCueFlashing } = useDing()
const { isSoundOn, toggleSound } = useSoundSetting()
const player = useAudioPlayer()

const book = ref<IBook | null>(null)
const phase = ref<Phase>('loading')
const pageIndex = ref(0)
const lineIndex = ref(0)

const pageNumbers = computed(() =>
    [...new Set((book.value?.lines ?? []).filter(line => line.audioFileId).map(line => line.pageIndex))].sort((a, b) => a - b),
)
const pageLines = computed(() =>
    (book.value?.lines ?? []).filter(line => line.audioFileId && line.pageIndex === pageNumbers.value[pageIndex.value]),
)
const currentLine = computed(() => pageLines.value[lineIndex.value] ?? null)
const reader = computed(() => getById(currentLine.value?.memberId ?? null))
const readerAccent = computed(() => memberHex(reader.value))
const readerHex = computed(() => (phase.value === 'playing' ? memberHexLight(reader.value) : '#FFF4D9'))
const isPlaying = computed(() => player.isPlaying.value)
const pageNumber = computed(() => pageIndex.value + 1)
const pageTotal = computed(() => pageNumbers.value.length)
const progressPercent = computed(() => {
    const total = pageLines.value.reduce((sum, line) => sum + line.audioMs, 0)
    if (total === 0) {
        return '0%'
    }
    const done = pageLines.value.slice(0, lineIndex.value).reduce((sum, line) => sum + line.audioMs, 0) + player.positionMs.value
    return `${Math.min(100, Math.round((done / total) * 100))}%`
})

const playLine = async (): Promise<void> => {
    const line = currentLine.value
    if (!line?.audioFileId) {
        return
    }
    phase.value = 'playing'
    await player.play(line.audioFileId)
}

const start = async (): Promise<void> => {
    unlock()
    player.unlock()
    pageIndex.value = 0
    lineIndex.value = 0
    await playLine()
}

const turnPage = async (): Promise<void> => {
    pageIndex.value += 1
    lineIndex.value = 0
    await playLine()
}

const replay = (): Promise<void> => start()

const togglePause = async (): Promise<void> => {
    if (isPlaying.value) {
        player.pause()
        return
    }
    await player.resume()
}

player.onEnded(async () => {
    if (lineIndex.value < pageLines.value.length - 1) {
        const nextPanelId = pageLines.value[lineIndex.value + 1]?.panelId ?? null
        const isNewPanel = nextPanelId !== null && nextPanelId !== (currentLine.value?.panelId ?? null)
        lineIndex.value += 1
        if (isNewPanel) {
            panelCue()
        }
        await playLine()
        return
    }
    if (pageIndex.value < pageNumbers.value.length - 1) {
        phase.value = 'page'
        ding()
        return
    }
    phase.value = 'end'
})

onMounted(async () => {
    try {
        book.value = await get(String(route.params.id))
        phase.value = pageNumbers.value.length > 0 ? 'ready' : 'end'
    } catch (error) {
        console.error('L histoire n a pas pu être chargée', error)
        await navigateTo('/kid')
    }
})
</script>

<style scoped>
.reader {
    display: flex;
    flex-direction: column;
    position: fixed;
    inset: 0;
    z-index: 40;
    padding: calc(env(safe-area-inset-top) + 16px) 16px calc(env(safe-area-inset-bottom) + 16px);
    transition: background 0.3s;
}

.reader__center {
    flex: 1;
    display: flex;
    gap: 18px;
}

.reader__bottom {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.reader__flash {
    animation: panel-flash 0.24s ease-out;
}

@keyframes panel-flash {
    from {
        opacity: 0.35;
        transform: scale(0.96);
    }

    to {
        opacity: 1;
        transform: scale(1);
    }
}

@media (prefers-reduced-motion: reduce) {
    .reader__flash {
        animation: none;
    }
}

.btn--big {
    min-width: 96px;
    min-height: 84px;
    font-size: 34px;
    border-radius: 28px;
}
</style>
