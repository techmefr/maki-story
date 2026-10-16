<template>
    <div class="reader" :class="{ 'reader--night on-dark': phase === 'sleep' }" :style="{ background: readerHex }">
        <NightCountdown />
        <div v-if="phase === 'page'" class="reader__center stack center">
            <img v-if="pageImage" :src="pageImage" alt="" class="reader__cover" data-testid="page-cover" />
            <MakiScene v-else pose="star" :size="200" />
            <h1 v-if="!pageImage" class="title">{{ t('kid.listen.nextPage') }}</h1>
            <div class="row">
                <AppButton variant="secondary" class="btn--big" :disabled="pageIndex === 0" :aria-label="t('kid.listen.previousPage')" data-testid="previous-page" v-sound="'page-turn'" @click="previousPage"><AppIcon name="skip-back" :size="44" class="mirror-rtl" /></AppButton>
                <AppButton class="btn--big" wiggle :aria-label="t('kid.listen.turnPage')" data-testid="turn-page" v-sound="'page-turn'" @click="turnPage"><AppIcon name="next" :size="48" motion="nudge" class="mirror-rtl" /></AppButton>
            </div>
        </div>
        <div v-else-if="phase === 'end'" class="reader__center stack center">
            <MakiScene pose="champion" :size="220" />
            <h1 class="title">{{ t('kid.listen.finished') }}</h1>
            <AppButton variant="secondary" class="btn--big" @click="replay"><AppIcon name="redo" :size="40" motion="spin" />{{ t('kid.listen.restart') }}</AppButton>
            <AppButton to="/kid" class="btn--big"><AppIcon name="home" :size="40" />{{ t('common.back') }}</AppButton>
        </div>
        <div v-else-if="phase === 'loading'" class="reader__center stack center">
            <MakiScene pose="melomane" :size="140" class="anim-pulse" />
        </div>
        <div v-else-if="phase === 'languages'" class="reader__center stack center">
            <AppIcon name="languages" :size="64" motion="float" />
            <h1 class="sr-only">{{ t('playback.chooseTitle') }}</h1>
            <div class="choices" role="group" :aria-label="t('playback.choices')">
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
            <MakiScene pose="reading" :size="220" />
            <div v-if="hasChoice" class="row">
                <button
                    v-if="!isLocked"
                    type="button"
                    class="choice choice--small"
                    :aria-label="t('playback.change')"
                    data-testid="change-language"
                    @click="phase = 'languages'"
                >
                    <FlagIcon :codes="languages ?? []" :size="72" aria-hidden="true" />
                </button>
                <span v-else class="choice choice--small choice--static" data-testid="current-language">
                    <FlagIcon :codes="languages ?? []" :size="72" />
                </span>
                <AppButton variant="secondary" is-round
                    :aria-label="isLocked ? t('playback.unlock') : t('playback.lock')"
                    :aria-pressed="isLocked"
                    data-testid="language-lock"
                    @click="onLockClick">
                    <AppIcon :name="isLocked ? 'lock' : 'unlock'" :size="30" />
                </AppButton>
            </div>
            <div v-if="resumeProgress" class="row">
                <AppButton class="btn--big" :aria-label="t('common.continue')" @click="resume"><AppIcon name="play" :size="56" motion="pulse" /></AppButton>
                <AppButton variant="secondary" class="btn--big" :aria-label="t('kid.listen.fromStart')" @click="start"><AppIcon name="redo" :size="48" motion="spin" /></AppButton>
            </div>
            <AppButton v-else class="btn--big" wiggle :aria-label="t('kid.listen.read')" @click="start"><AppIcon name="play" :size="56" motion="pulse" /></AppButton>
        </div>
        <div v-else-if="phase === 'sleep'" class="reader__center stack center">
            <AppIcon name="moon" :size="140" motion="float" />
            <h1 class="title">{{ t('kid.listen.goodNight') }}</h1>
            <AppButton variant="secondary" to="/kid" class="btn--big"><AppIcon name="home" :size="40" />{{ t('common.back') }}</AppButton>
        </div>
        <div v-else class="reader__center stack center" :class="{ reader__flash: isCueFlashing }">
            <AppBlob :active="isPlaying" :color="readerAccent" :size="200">
                <AppAvatar :member="reader" :size="200" />
            </AppBlob>
            <h1 class="title">{{ t('kid.listen.reads', { name: reader?.name ?? '' }) }}</h1>
            <div class="row">
                <AppButton variant="secondary" is-round class="btn--big" :disabled="pageIndex === 0" :aria-label="t('kid.listen.previousPage')" data-testid="previous-page" v-sound="'page-turn'" @click="previousPage">
                    <AppIcon name="skip-back" :size="40" class="mirror-rtl" />
                </AppButton>
                <AppButton variant="secondary" class="btn--big" :disabled="isPlaying" :aria-label="isPlaying ? t('kid.listen.playing') : t('kid.listen.resumePlay')" @click="resumePlayback">
                    <AppIcon :name="isPlaying ? 'volume' : 'play'" :size="48" />
                </AppButton>
                <AppButton variant="secondary" is-round class="btn--big" :disabled="pageIndex >= pageTotal - 1" :aria-label="t('kid.listen.nextPageShort')" data-testid="skip-page" v-sound="'page-turn'" @click="skipPage">
                    <AppIcon name="skip-forward" :size="40" class="mirror-rtl" />
                </AppButton>
            </div>
        </div>
        <div v-if="isTurning" class="page-turn" data-testid="page-turn" aria-hidden="true" />
        <div class="reader__bottom">
            <div class="progress" role="progressbar" :aria-label="t('kid.listen.progress')" aria-valuemin="0" aria-valuemax="100" :aria-valuenow="progressValue"><div class="progress__fill" :style="{ width: progressPercent, background: '#1E1A3F' }" /></div>
            <div class="row row--wrap" style="justify-content: space-between">
                <AppButton variant="secondary" size="sm" to="/kid"><AppIcon name="close" :size="18" />{{ t('kid.listen.quit') }}</AppButton>
                <AppButton variant="secondary" size="sm" :aria-pressed="isSoundOn" @click="toggleSound">
                    <AppIcon :name="isSoundOn ? 'volume' : 'mute'" :size="18" />{{ isSoundOn ? t('kid.listen.soundOn') : t('kid.listen.soundOff') }}
                </AppButton>
                <AppButton variant="secondary" size="sm"
                    v-if="canSleep"
                    :aria-pressed="sleepTimer.choice.value !== null"
                    :aria-label="t('kid.listen.sleepTimer')"
                    @click="isSleepOpen = true">
                    <AppIcon name="moon" :size="22" :is-active="sleepTimer.choice.value !== null" />
                </AppButton>
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
const PAGE_TURN_MS = 700

type Phase = 'loading' | 'languages' | 'ready' | 'playing' | 'page' | 'end' | 'sleep'

definePageMeta({ layout: 'blank' })

const { t, formatNumber } = useI18n()
const route = useRoute()
const { get } = useBooks()
const { fetchUrl } = useFiles()
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
useLockAfterPage(() => phase.value === 'playing')
const pageIndex = ref(0)
const lineIndex = ref(0)
const resumeProgress = ref<IPlaybackProgress | null>(null)
const isSleepOpen = ref(false)

const bookPages = ref<IBookPage[]>([])
const pageImage = ref('')

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
const pageNumbers = computed(() =>
    bookPages.value.length > 0 ? bookPages.value.map(page => page.position).sort((a, b) => a - b) : [...new Set(steps.value.map(step => step.pageIndex))].sort((a, b) => a - b),
)
const pageLines = computed(() => steps.value.filter(step => step.pageIndex === pageNumbers.value[pageIndex.value]))
const currentLine = computed(() => pageLines.value[lineIndex.value] ?? null)
const reader = computed(() => getById(currentLine.value?.memberId ?? null))
const readerAccent = computed(() => memberHex(reader.value))
const readerHex = computed(() => {
    if (phase.value === 'sleep') {
        return 'var(--night)'
    }
    return phase.value === 'playing' ? memberHexLight(reader.value) : 'var(--cream)'
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

const loadPages = async (): Promise<void> => {
    try {
        bookPages.value = (await get(bookId)).pages
    } catch {
        bookPages.value = []
    }
}

const loadPageImage = async (): Promise<void> => {
    pageImage.value = ''
    const page = bookPages.value.find(item => item.position === pageNumbers.value[pageIndex.value])
    if (!page || page.kind !== 'cover' || !page.fileId) {
        return
    }
    try {
        pageImage.value = await fetchUrl(page.fileId)
    } catch {
        pageImage.value = ''
    }
}

const showPage = async (index: number, startLine = 0, startMs = 0): Promise<void> => {
    pageIndex.value = index
    lineIndex.value = startLine
    await loadPageImage()
    if (pageLines.value.length > 0) {
        await playLine(startMs)
        return
    }
    player.stop()
    phase.value = 'page'
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
    const labels = codes.map(code => LANGUAGES.find(item => item.code === code)?.label ?? code)
    return labels.length === 2 ? t('playback.pair', { first: labels[0]!, second: labels[1]! }) : labels.join(', ')
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
        gateError.value = t('parental.gate.wrong')
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
    await showPage(progress.pageIndex, progress.lineIndex, progress.positionMs)
}

const start = async (): Promise<void> => {
    unlock()
    player.unlock()
    resumeProgress.value = null
    await showPage(0)
}

const isTurning = ref(false)

const runTurn = async (): Promise<void> => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return
    }
    isTurning.value = true
    ding()
    await new Promise(resolve => setTimeout(resolve, PAGE_TURN_MS))
    isTurning.value = false
}

const goToPage = async (index: number): Promise<void> => {
    unlock()
    player.unlock()
    await runTurn()
    if (index >= pageTotal.value) {
        player.stop()
        phase.value = 'end'
        sleepTimer.cancel()
        await progressStore.clear()
        return
    }
    await showPage(index)
}

const turnPage = (): Promise<void> => goToPage(pageIndex.value + 1)

const previousPage = (): Promise<void> => goToPage(Math.max(0, pageIndex.value - 1))

const skipPage = (): Promise<void> => goToPage(Math.min(pageTotal.value - 1, pageIndex.value + 1))

const replay = (): Promise<void> => start()

const resumePlayback = async (): Promise<void> => {
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
        await loadPages()
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
.reader__center > .row {
    justify-content: center;
    flex-wrap: wrap;
}

@media (min-width: 1024px) {
    .reader {
        padding: 32px max(32px, calc((100vw - 960px) / 2));
    }

    .reader__center {
        gap: 24px;
    }
}

@media (max-height: 540px) {
    .reader__center {
        flex: none;
        min-height: min-content;
        padding-block: 16px;
    }

    .reader__center :deep(.scene) {
        max-height: 120px;
    }

    .reader__bottom {
        margin-top: auto;
    }
}

.reader {
    display: flex;
    flex-direction: column;
    position: fixed;
    inset: 0;
    z-index: 40;
    padding: calc(env(safe-area-inset-top) + 16px) 16px calc(env(safe-area-inset-bottom) + 16px);
    overflow-y: auto;
    color: var(--on-accent);
    transition: background 0.3s;
}

.reader--night {
    color: var(--cream);
}

.reader__cover {
    flex: 1;
    min-height: 0;
    width: 100%;
    object-fit: contain;
    border: var(--outline) solid var(--ink);
    border-radius: 18px;
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

.page-turn {
    position: fixed;
    inset: 0;
    z-index: 60;
    pointer-events: none;
    background: linear-gradient(100deg, #FFF3DC 0%, #ffe9b3 60%, #1E1A3F22 100%);
    border-inline-start: 3px solid #1E1A3F;
    transform-origin: left center;
    animation: page-turn 0.7s ease-in-out forwards;
}

[dir='rtl'] .page-turn {
    transform-origin: right center;
}

@keyframes page-turn {
    from {
        transform: perspective(1200px) rotateY(0);
        opacity: 1;
    }
    to {
        transform: perspective(1200px) rotateY(-100deg);
        opacity: 0.2;
    }
}

@media (prefers-reduced-motion: reduce) {
    .page-turn {
        display: none;
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
    background: var(--paper);
    color: var(--ink);
    border: 3px solid var(--ink);
    border-radius: 24px;
    box-shadow: 3px 3px 0 #1E1A3F;
    cursor: pointer;
    min-width: 96px;
    min-height: 84px;
    align-items: center;
    justify-content: center;
}

.choice:active:not(.choice--static) {
    transform: translate(3px, 3px);
    box-shadow: 0 0 0 #1E1A3F;
}

.choice--small {
    padding: 6px;
    border-radius: 18px;
}

.choice--static {
    cursor: default;
}
</style>
