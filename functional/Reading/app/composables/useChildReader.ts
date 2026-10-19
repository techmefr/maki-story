import { normalizeReadingProgress } from '~~/shared/utils/readingProgress'

export const useChildReader = () => {
    const PAGE_TURN_MS = 700

    type Phase = 'loading' | 'languages' | 'ready' | 'playing' | 'page' | 'end' | 'sleep'


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
    useLockAfterPage(() => phase.value === 'playing')
    const pageIndex = ref(0)
    const lineIndex = ref(0)
    const resumeProgress = ref<IPlaybackProgress | null>(null)
    const isSleepOpen = ref(false)

    const bookData = ref<IBook | null>(null)
    const bookPages = ref<IBookPage[]>([])
    const playbackError = ref('')
    const isNavigating = ref(false)

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
    const bookTitle = computed(() => bookData.value?.title ?? '')
    const readerHex = computed(() => {
        if (phase.value === 'sleep') {
            return 'var(--night)'
        }
        return phase.value === 'playing' ? memberHex(reader.value) : 'var(--cream)'
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
        const isOk = await player.play(line.fileId, startMs)
        playbackError.value = isOk ? '' : t('common.unknownError')
        if (isOk) {
            await saveProgress()
        }
    }

    const loadPages = async (): Promise<void> => {
        try {
            bookData.value = await get(bookId)
            bookPages.value = bookData.value.pages
        } catch {
            bookPages.value = []
        }
    }

    const showPage = async (index: number, startLine = 0, startMs = 0): Promise<void> => {
        pageIndex.value = index
        lineIndex.value = startLine
        if (pageLines.value.length > 0) {
            await playLine(startMs)
            return
        }
        player.stop()
        phase.value = 'page'
        await progressStore.save({ pageIndex: index, lineIndex: 0, positionMs: 0 })
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
        resumeProgress.value = normalizeReadingProgress(saved, pageNumbers.value, steps.value)
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
        await new Promise(resolve => setTimeout(resolve, PAGE_TURN_MS))
        isTurning.value = false
    }

    const goToPage = async (index: number): Promise<void> => {
        if (isNavigating.value || index < 0) {
            return
        }
        isNavigating.value = true
        player.stop()
        unlock()
        player.unlock()
        try {
            await runTurn()
            if (index >= pageTotal.value) {
                phase.value = 'end'
                sleepTimer.cancel()
                await progressStore.clear()
                return
            }
            await showPage(index)
        } finally {
            isNavigating.value = false
        }
    }

    const turnPage = (): Promise<void> => goToPage(pageIndex.value + 1)

    const previousPage = (): Promise<void> => goToPage(Math.max(0, pageIndex.value - 1))

    const skipPage = (): Promise<void> => goToPage(Math.min(pageTotal.value - 1, pageIndex.value + 1))

    const replay = (): Promise<void> => start()

    const resumePlayback = async (): Promise<void> => {
        await playLine(lastPosition)
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
        if (isNavigating.value || phase.value !== 'playing') {
            return
        }
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
                phase.value = hasChoice.value ? 'languages' : pageNumbers.value.length > 0 ? 'ready' : 'end'
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

    return { readerHex, phase, reader, currentLine, isPlaying, pageIndex, pageTotal, isNavigating, previousPage, turnPage, replay, choices, choiceLabel, choose, hasChoice, isLocked, languages, onLockClick, resumeProgress, resume, start, canSleep, sleepTimer, isSleepOpen, isCueFlashing, playbackError, resumePlayback, skipPage, isTurning, progressValue, progressPercent, isSoundOn, toggleSound, pageNumber, pageNumbers, isGateOpen, members, isGateBusy, gateError, gateAttempt, unlockWithParent, chooseSleep, cancelSleep, bookTitle }
}
