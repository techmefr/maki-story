<template>
    <div class="reader" :class="{ 'reader--night on-dark': phase === 'sleep' }" :style="{ background: readerHex }">
        <div v-if="phase === 'page'" class="reader__center stack center">
            <AppMaki :size="160" class="anim-bounce" />
            <h1 class="title">{{ t('kid.listen.nextPage') }}</h1>
            <button type="button" class="btn btn--big" :aria-label="t('kid.listen.turnPage')" v-sound="'page-turn'" @click="turnPage"><AppIcon name="next" :size="48" motion="nudge" class="mirror-rtl" /></button>
        </div>
        <div v-else-if="phase === 'end'" class="reader__center stack center">
            <AppMaki :size="160" />
            <h1 class="title">{{ t('kid.listen.finished') }}</h1>
            <button type="button" class="btn btn--big btn--white" @click="replay"><AppIcon name="redo" :size="40" motion="spin" />{{ t('kid.listen.restart') }}</button>
            <NuxtLink to="/kid" class="btn btn--big"><AppIcon name="home" :size="40" />{{ t('common.back') }}</NuxtLink>
        </div>
        <div v-else-if="phase === 'loading'" class="reader__center stack center">
            <AppMaki :size="120" class="anim-pulse" />
        </div>
        <div v-else-if="phase === 'languages'" class="reader__center stack center">
            <AppIcon name="languages" :size="64" motion="float" />
            <h1 class="sr-only">Choisis la langue de l’histoire</h1>
            <div class="choices" role="group" aria-label="Langues de l’histoire">
                <button
                    v-for="choice in choices"
                    :key="choice.join('-')"
                    type="button"
                    class="choice"
                    :aria-label="choiceLabel(choice)"
                    :data-choice="choice.join('-')"
                    @click="choose(choice)"
                >
                    <FlagIcon :codes="choice" :size="112" aria-hidden="true" />
                </button>
            </div>
        </div>
        <div v-else-if="phase === 'ready'" class="reader__center stack center">
            <AppMaki :size="160" />
            <div v-if="hasChoice" class="row">
                <button
                    v-if="!isLocked"
                    type="button"
                    class="choice choice--small"
                    aria-label="Changer de langue"
                    data-testid="change-language"
                    @click="phase = 'languages'"
                >
                    <FlagIcon :codes="languages ?? []" :size="72" aria-hidden="true" />
                </button>
                <span v-else class="choice choice--small choice--static" data-testid="current-language">
                    <FlagIcon :codes="languages ?? []" :size="72" />
                </span>
                <button
                    type="button"
                    class="btn btn--white btn--round"
                    :aria-label="isLocked ? 'Déverrouiller la langue avec le code d’un parent' : 'Verrouiller la langue'"
                    :aria-pressed="isLocked"
                    data-testid="language-lock"
                    @click="onLockClick"
                >
                    <AppIcon :name="isLocked ? 'lock' : 'unlock'" :size="30" />
                </button>
            </div>
            <div v-if="resumeProgress" class="row">
                <button type="button" class="btn btn--big" :aria-label="t('common.continue')" @click="resume"><AppIcon name="play" :size="56" motion="pulse" /></button>
                <button type="button" class="btn btn--big btn--white" :aria-label="t('kid.listen.fromStart')" @click="start"><AppIcon name="redo" :size="48" motion="spin" /></button>
            </div>
            <button v-else type="button" class="btn btn--big" :aria-label="t('kid.listen.read')" @click="start"><AppIcon name="play" :size="56" motion="pulse" /></button>
        </div>
        <div v-else-if="phase === 'sleep'" class="reader__center stack center">
            <AppIcon name="moon" :size="140" motion="float" />
            <h1 class="title">{{ t('kid.listen.goodNight') }}</h1>
            <NuxtLink to="/kid" class="btn btn--big btn--white"><AppIcon name="home" :size="40" />{{ t('common.back') }}</NuxtLink>
        </div>
        <div v-else class="reader__center stack center" :class="{ reader__flash: isCueFlashing }">
            <AppBlob :active="isPlaying" :color="readerAccent" :size="200">
                <AppAvatar :member="reader" :size="200" />
            </AppBlob>
            <h1 class="title">{{ t('kid.listen.reads', { name: reader?.name ?? '' }) }}</h1>
            <button type="button" class="btn btn--big btn--white" :aria-label="isPlaying ? t('kid.listen.pause') : t('kid.listen.resumePlay')" @click="togglePause">
                <AppIcon :name="isPlaying ? 'pause' : 'play'" :size="48" />
            </button>
        </div>
        <div class="reader__bottom">
            <div class="progress" role="progressbar" :aria-label="t('kid.listen.progress')" aria-valuemin="0" aria-valuemax="100" :aria-valuenow="progressValue"><div class="progress__fill" :style="{ width: progressPercent, background: '#1F1B3A' }" /></div>
            <div class="row row--wrap" style="justify-content: space-between">
                <NuxtLink to="/kid" class="btn btn--small btn--white"><AppIcon name="close" :size="18" />{{ t('kid.listen.quit') }}</NuxtLink>
                <button type="button" class="btn btn--small btn--white" :aria-pressed="isSoundOn" @click="toggleSound">
                    <AppIcon :name="isSoundOn ? 'volume' : 'mute'" :size="18" />{{ isSoundOn ? t('kid.listen.soundOn') : t('kid.listen.soundOff') }}
                </button>
                <button
                    v-if="canSleep"
                    type="button"
                    class="btn btn--small btn--white"
                    :aria-pressed="sleepTimer.choice.value !== null"
                    :aria-label="t('kid.listen.sleepTimer')"
                    @click="isSleepOpen = true"
                >
                    <AppIcon name="moon" :size="22" :is-active="sleepTimer.choice.value !== null" />
                </button>
                <span class="badge">{{ t('kid.listen.page', { current: formatNumber(pageNumber), total: formatNumber(pageTotal) }) }}</span>
            </div>
        </div>
        <ParentGate
            v-if="isGateOpen"
            :members="members"
            :is-busy="isGateBusy"
            :error-message="gateError"
            :attempt="gateAttempt"
            @submit="unlockWithParent"
            @cancel="isGateOpen = false"
        />
        <SleepSheet
            v-if="isSleepOpen"
            :active="sleepTimer.choice.value"
            @select="chooseSleep"
            @cancel="cancelSleep"
            @close="isSleepOpen = false"
        />
    </div>
</template>

<script setup lang="ts">
type Phase = 'loading' | 'languages' | 'ready' | 'playing' | 'page' | 'end' | 'sleep'

definePageMeta({ layout: 'blank' })

const { t, formatNumber } = useI18n()
const route = useRoute()
const { get } = useBooks()
const { members, getById, ensureLoaded } = useMembers()
const { currentId, current } = useCurrentMember()
const { ding, unlock, panelCue, isCueFlashing } = useDing()
const { isSoundOn, toggleSound } = useSoundSetting()
const bookId = String(route.params.id)
const playbackLanguages = usePlaybackLanguages(bookId)
const progressStore = usePlaybackProgress(bookId)
const sleepTimer = useSleepTimer()
let lastSavedAt = 0
let lastPosition = 0

onBeforeUnmount(() => leave())

const player = useAudioPlayer()

const plan = ref<IPlaybackPlan | null>(null)
const isGateOpen = ref(false)
const isGateBusy = ref(false)
const gateError = ref('')
const gateAttempt = ref(0)
const phase = ref<Phase>('loading')
const pageIndex = ref(0)
const lineIndex = ref(0)
const resumeProgress = ref<IPlaybackProgress | null>(null)
const isSleepOpen = ref(false)

const steps = computed(() => plan.value?.steps ?? [])
const languages = computed(() => plan.value?.languages ?? null)
const available = computed(() => (plan.value?.available ?? []).map(item => item.code))
const hasChoice = computed(() => available.value.length > 1)
const isLocked = computed(() => plan.value?.config?.isLocked === true)
const choices = computed(() => {
    const singles = available.value.map(code => [code])
    const pairs = available.value.flatMap((first, index) => available.value.slice(index + 1).map(second => [first, second]))
    return [...singles, ...pairs]
})
const pageNumbers = computed(() => [...new Set(steps.value.map(step => step.pageIndex))].sort((a, b) => a - b))
const pageLines = computed(() => steps.value.filter(step => step.pageIndex === pageNumbers.value[pageIndex.value]))
const currentLine = computed(() => pageLines.value[lineIndex.value] ?? null)
const reader = computed(() => getById(currentLine.value?.memberId ?? null))
const readerAccent = computed(() => memberHex(reader.value))
const readerHex = computed(() => {
    if (phase.value === 'sleep') {
        return '#3B3470'
    }
    return phase.value === 'playing' ? memberHexLight(reader.value) : '#FFF4D9'
})
const canSleep = computed(() => ['ready', 'playing', 'page'].includes(phase.value))
const isPlaying = computed(() => player.isPlaying.value)
const pageNumber = computed(() => pageIndex.value + 1)
const pageTotal = computed(() => pageNumbers.value.length)
const progressPercent = computed(() => {
    const total = pageLines.value.reduce((sum, line) => sum + line.durationMs, 0)
    if (total === 0) {
        return '0%'
    }
    const done = pageLines.value.slice(0, lineIndex.value).reduce((sum, line) => sum + line.durationMs, 0) + player.positionMs.value
    return `${Math.min(100, Math.round((done / total) * 100))}%`
})

const progressValue = computed(() => Number.parseInt(progressPercent.value, 10))

const saveProgress = async (): Promise<void> => {
    if (phase.value !== 'playing') {
        return
    }
    lastSavedAt = Date.now()
    await progressStore.save({ pageIndex: pageIndex.value, lineIndex: lineIndex.value, positionMs: lastPosition })
}

const saveNextPage = async (): Promise<void> => {
    lastSavedAt = Date.now()
    await progressStore.save({ pageIndex: pageIndex.value + 1, lineIndex: 0, positionMs: 0 })
}

const playLine = async (startMs = 0): Promise<void> => {
    const line = currentLine.value
    if (!line) {
        return
    }
    phase.value = 'playing'
    lastPosition = startMs
    await player.play(line.fileId, startMs)
    await saveProgress()
}

const sleepNow = async (): Promise<void> => {
    if (phase.value === 'playing') {
        await saveProgress()
    }
    player.stop()
    player.setVolume(1)
    isSleepOpen.value = false
    phase.value = 'sleep'
}

const chooseSleep = (id: SleepChoiceId): void => {
    sleepTimer.start(id)
    isSleepOpen.value = false
}

const cancelSleep = (): void => {
    sleepTimer.cancel()
    isSleepOpen.value = false
}

const choiceLabel = (codes: string[]): string => {
    return codes.map(code => LANGUAGES.find(item => item.code === code)?.label ?? code).join(' puis ')
}

const restoreProgress = async (): Promise<void> => {
    const saved = await progressStore.load()
    const savedSteps = steps.value.filter(step => step.pageIndex === pageNumbers.value[saved?.pageIndex ?? -1])
    resumeProgress.value = saved && saved.lineIndex < savedSteps.length ? saved : null
}

const reloadPlan = async (requested: string[] | null): Promise<void> => {
    plan.value = await playbackLanguages.loadPlan(requested)
    await restoreProgress()
}

const loadOfflinePlan = async (): Promise<void> => {
    const book = await get(bookId)
    const planLines = book.lines.map(line => ({ id: line.id, pageIndex: line.pageIndex, panelId: line.panelId }))
    plan.value = {
        bookId,
        bookLanguage: book.language,
        languages: [book.language],
        available: [{ code: book.language, recordedCount: book.recordings.length }],
        config: null,
        steps: buildPlaybackSteps(planLines, book.recordings, [book.language], book.language),
    }
    await restoreProgress()
}

const choose = async (codes: string[]): Promise<void> => {
    if (currentId.value) {
        await playbackLanguages.saveConfig(currentId.value, codes)
    }
    await progressStore.clear()
    await reloadPlan(codes)
    phase.value = pageNumbers.value.length > 0 ? 'ready' : 'end'
}

const lock = async (proof: { parentId?: string; code?: string }): Promise<void> => {
    if (!currentId.value) {
        return
    }
    const config = await playbackLanguages.setLock(currentId.value, !isLocked.value, proof)
    if (plan.value) {
        plan.value = { ...plan.value, config }
    }
}

const onLockClick = async (): Promise<void> => {
    if (current.value?.role === 'parent') {
        await lock({})
        return
    }
    gateError.value = ''
    isGateOpen.value = true
}

const unlockWithParent = async (parentId: string, code: string): Promise<void> => {
    isGateBusy.value = true
    gateError.value = ''
    try {
        await lock({ parentId, code })
        isGateOpen.value = false
    } catch (error) {
        console.error('Le code du parent a été refusé', error)
        gateError.value = 'Ce code ne convient pas.'
        gateAttempt.value += 1
    } finally {
        isGateBusy.value = false
    }
}

const resume = async (): Promise<void> => {
    const progress = resumeProgress.value
    if (!progress) {
        return
    }
    unlock()
    player.unlock()
    pageIndex.value = progress.pageIndex
    lineIndex.value = progress.lineIndex
    await playLine(progress.positionMs)
}

const start = async (): Promise<void> => {
    unlock()
    player.unlock()
    pageIndex.value = 0
    lineIndex.value = 0
    resumeProgress.value = null
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
        await saveProgress()
        return
    }
    await player.resume()
}

sleepTimer.onFade(ratio => player.setVolume(ratio))
sleepTimer.onExpire(sleepNow)

watch(
    () => player.positionMs.value,
    position => {
        if (phase.value !== 'playing') {
            return
        }
        lastPosition = position
        if (Date.now() - lastSavedAt >= PROGRESS_SAVE_INTERVAL_MS) {
            void saveProgress()
        }
    },
    { flush: 'sync' },
)

const leave = (): void => {
    if (phase.value === 'playing') {
        void saveProgress()
    }
}

const onVisibility = (): void => {
    if (document.visibilityState === 'hidden') {
        leave()
    }
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
        await saveNextPage()
        if (sleepTimer.consumePageEnd()) {
            player.setVolume(1)
            phase.value = 'sleep'
            return
        }
        phase.value = 'page'
        ding()
        return
    }
    phase.value = 'end'
    sleepTimer.cancel()
    await progressStore.clear()
})

onMounted(async () => {
    document.addEventListener('visibilitychange', onVisibility)
    try {
        await ensureLoaded()
        try {
            await reloadPlan(null)
        } catch (error) {
            if ((error as { statusCode?: number }).statusCode !== undefined) {
                throw error
            }
            await loadOfflinePlan()
        }
        if (languages.value === null) {
            phase.value = hasChoice.value ? 'languages' : 'end'
            return
        }
        phase.value = pageNumbers.value.length > 0 ? 'ready' : 'end'
    } catch (error) {
        console.error('L histoire n a pas pu être chargée', error)
        await navigateTo('/kid')
    }
})

onBeforeUnmount(() => {
    document.removeEventListener('visibilitychange', onVisibility)
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
    overflow-y: auto;
    transition: background 0.3s;
}

.reader--night {
    color: var(--cream);
}

.reader__center {
    flex: 1;
    display: flex;
    gap: 18px;
    min-height: 0;
    justify-content: safe center;
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

.choices {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 16px;
}

.choice {
    display: inline-flex;
    padding: 10px;
    background: #fff;
    border: 3px solid #1f1b3a;
    border-radius: 24px;
    box-shadow: 3px 3px 0 #1f1b3a;
    cursor: pointer;
    min-width: 96px;
    min-height: 84px;
    align-items: center;
    justify-content: center;
}

.choice:active:not(.choice--static) {
    transform: translate(3px, 3px);
    box-shadow: 0 0 0 #1f1b3a;
}

.choice--small {
    padding: 6px;
    border-radius: 18px;
}

.choice--static {
    cursor: default;
}

.btn--big {
    min-width: 96px;
    min-height: 84px;
    font-size: min(2.125rem, 8vw);
    border-radius: 28px;
}
</style>
