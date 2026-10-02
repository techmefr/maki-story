<template>
    <div class="stack narrow" v-if="book">
        <NuxtLink to="/home" class="link-back"><AppIcon name="back" :size="18" class="mirror-rtl" />{{ t('common.back') }}</NuxtLink>
        <h1 class="title">{{ book.title }}</h1>
        <div class="row">
            <div class="progress grow" role="progressbar" :aria-label="t('studio.progress')" aria-valuemin="0" aria-valuemax="100" :aria-valuenow="progressValue"><div class="progress__fill" :style="{ width: progressPercent }" /></div>
            <span class="badge">{{ recordedCount }}/{{ visibleLines.length }}</span>
        </div>
        <div class="stack">
            <label class="label" for="studio-language">{{ t('studio.recordingLanguage') }}</label>
            <AppSelect id="studio-language" v-model="language" :disabled="isLocked" :options="languageOptions" />
            <p v-if="!isLanguageChosen" class="error" role="alert">{{ t('studio.languageRequired') }}</p>
        </div>
        <div class="row row--wrap">
            <button
                v-for="tab in tabs"
                :key="tab.member.id"
                type="button"
                class="picker"
                :disabled="isLocked"
                :aria-pressed="tab.member.id === activeMemberId"
                :style="{ background: tab.member.id === activeMemberId ? tab.hex : '#fff' }"
                @click="selectMember(tab.member.id)"
            >
                <AppAvatar :member="tab.member" :size="28" />
                <span>{{ tab.member.name }} {{ tab.progress }}</span>
            </button>
        </div>
        <div v-if="redoCount > 0 || isRedoOnly" class="row row--wrap" role="group" :aria-label="t('review.studio.filterLabel')">
            <button type="button" class="chip studio__chip" :class="{ 'chip--on': !isRedoOnly }" :aria-pressed="!isRedoOnly" :disabled="isLocked" @click="setRedoOnly(false)">
                {{ t('review.studio.all') }}
            </button>
            <button type="button" class="chip studio__chip" :class="{ 'chip--on': isRedoOnly }" :aria-pressed="isRedoOnly" :disabled="isLocked" @click="setRedoOnly(true)">
                {{ t('review.studio.redoCount', { count: redoCount }) }}
            </button>
        </div>
        <section
            v-if="currentLine"
            class="stage"
            :class="{ 'stage--prompter': isPrompter }"
            :style="{ background: activeHex }"
            :aria-label="t('studio.prompter')"
        >
            <div class="stage__bar row row--wrap">
                <AppButton variant="secondary" size="sm" :aria-pressed="isPrompter" @click="togglePrompter">
                    <AppIcon :name="isPrompter ? 'close' : 'eye'" :size="18" />
                    {{ isPrompter ? t('studio.prompterExit') : t('studio.prompter') }}
                </AppButton>
                <AppButton variant="secondary" size="sm"
                    v-if="speech.isAvailable.value"
                    :aria-pressed="speech.isEnabled.value"
                    :aria-label="t('studio.assist')"
                    @click="toggleAssist">
                    <AppIcon :name="speech.isEnabled.value ? 'volume' : 'mute'" :size="18" />
                    {{ speech.isEnabled.value ? t('studio.assistOn') : t('studio.assistOff') }}
                </AppButton>
            </div>
            <div v-if="speech.isAvailable.value && speech.isEnabled.value" class="stage__bar row row--wrap">
                <button
                    v-for="category in SPEECH_CATEGORIES"
                    :key="category.id"
                    type="button"
                    class="chip"
                    :class="{ 'chip--on': speech.categories[category.id] }"
                    :aria-pressed="speech.categories[category.id]"
                    @click="speech.toggleCategory(category.id)"
                >
                    {{ t(`studio.categories.${category.id}`) }}
                </button>
                <AppButton variant="secondary" size="sm" :disabled="isRecording" @click="assistCurrentLine">
                    <AppIcon name="ear" :size="18" />
                    {{ t('studio.replayAssist') }}
                </AppButton>
            </div>
            <div class="stage__script stack">
                <div class="label">{{ t('studio.lineCounter', { character: currentLine.character || t('studio.narrator'), index: currentIndex + 1, total: memberLines.length }) }}</div>
                <p class="stage__text" data-testid="teleprompter-text">{{ lineText(currentLine) }}</p>
                <div v-if="book.imageDesc" class="hint">{{ t('studio.image', { text: book.imageDesc }) }}</div>
                <div v-if="activeTone" class="hint">{{ t('studio.voiceTone', { text: activeTone }) }}</div>
                <div v-if="currentLine.note" class="hint">{{ t('studio.note', { text: currentLine.note }) }}</div>
                <div v-if="lineTone(currentLine)" class="hint">{{ t('studio.toneLine', { text: lineTone(currentLine) }) }}</div>
                <div v-if="currentLine.sceneDescription" class="hint">{{ t('studio.sceneLine', { text: currentLine.sceneDescription }) }}</div>
                <div v-if="currentPageDescription" class="hint">{{ t('studio.pageLine', { text: currentPageDescription }) }}</div>
                <div v-if="isStale(currentLine)" class="hint" data-testid="stale-notice">{{ t('review.studio.stale') }}</div>
                <div v-for="comment in openCommentsOf(currentLine)" :key="comment.id" class="hint" data-testid="line-comment">
                    {{ t('review.studio.comment', { name: memberName(comment.authorMemberId), text: comment.body }) }}
                </div>
                <p v-if="nextLine" class="stage__next">{{ t('studio.next', { text: lineText(nextLine) }) }}</p>
            </div>
            <div class="stage__controls stack center">
                <WaveBars :is-active="isRecording" :color="activeHex" />
                <div class="subtitle" role="timer">{{ timeLabel }}</div>
                <div v-if="isRecording" class="badge" data-testid="countdown">{{ t('studio.remaining', { time: formatDuration(remainingMs) }) }}</div>
                <p v-if="limitNotice" class="error" role="status">{{ limitNotice }}</p>
                <template v-if="pending">
                    <p class="label">{{ t('studio.listenBeforeSend') }}</p>
                    <audio class="stage__audio" :src="pending.url" controls :aria-label="t('studio.takeAudio')" />
                    <div class="row row--wrap">
                        <AppButton variant="secondary" tone="mint" size="sm" :disabled="isBusy" @click="sendTake">
                            <AppIcon name="send" :size="18" />
                            {{ isBusy ? t('studio.sending') : t('common.send') }}
                        </AppButton>
                        <AppButton variant="secondary" size="sm" :disabled="isBusy" @click="cancelTake">
                            <AppIcon name="close" :size="18" />
                            {{ t('common.cancel') }}
                        </AppButton>
                    </div>
                </template>
                <button
                    v-else
                    type="button"
                    class="rec"
                    :class="{ 'rec--on': isRecording }"
                    :disabled="isBusy || !isLanguageChosen"
                    :aria-label="isRecording ? t('studio.stopRecord') : t('studio.record')"
                    @click="toggleRecord"
                >
                    <AppIcon :name="isRecording ? 'stop' : 'mic'" :size="44" :motion="isRecording ? 'pulse' : 'none'" />
                </button>
                <div class="muted">{{ hint }}</div>
                <div v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</div>
                <div class="row row--wrap">
                    <AppButton variant="secondary" size="sm" :disabled="isLocked || !hasPrevious" @click="goRelative(-1)">
                        <AppIcon name="skip-back" :size="18" class="mirror-rtl" />
                        {{ t('studio.previousLine') }}
                    </AppButton>
                    <AppButton variant="secondary" size="sm" :disabled="isLocked || !hasNext" @click="goRelative(1)">
                        {{ t('studio.nextLine') }}
                        <AppIcon name="skip-forward" :size="18" class="mirror-rtl" />
                    </AppButton>
                </div>
                <div class="row row--wrap">
                    <AppButton variant="secondary" size="sm" :disabled="!currentRecording || isLocked" @click="listen">
                        <AppIcon :name="isPlaying ? 'stop' : 'volume'" :size="18" />
                        {{ isPlaying ? t('studio.stopPlayback') : t('studio.listen') }}
                    </AppButton>
                    <AppButton variant="secondary" size="sm" :disabled="!currentRecording || isLocked" @click="redo">
                        <AppIcon name="redo" :size="18" />
                        {{ t('studio.redo') }}
                    </AppButton>
                </div>
            </div>
        </section>
        <div v-if="memberLines.length > 0" class="stack">
            <button
                v-for="line in memberLines"
                :key="line.id"
                type="button"
                class="card card--tap row"
                :disabled="isLocked"
                :style="{ background: line.id === currentLineId ? '#FFF4D9' : '#fff' }"
                @click="currentLineId = line.id"
            >
                <span class="dot dot--mark" aria-hidden="true" :style="{ background: hasVoice(line, language) ? activeHex : '#fff' }">{{ hasVoice(line, language) ? '✓' : '' }}</span>
                <span class="grow">{{ lineText(line) }}</span>
                <span v-if="needsRedo(line)" class="badge studio__redo">{{ t('review.filters.redo') }}</span>
            </button>
        </div>
        <p v-else class="muted">{{ t('studio.noLines') }}</p>
        <CoverageTable
            v-if="visibleLines.length > 0"
            :lines="visibleLines"
            :recordings="book.recordings"
            :languages="coverageLanguages"
            :get-member-name="memberName"
            @select="jumpTo"
        />
        <AppButton variant="secondary" tone="mint" is-block v-if="isRestricted" :disabled="draftCount === 0 || isLocked" @click="sendForReview">
            <AppIcon name="send" :size="22" />
            {{ draftCount > 0 ? t('review.studio.send', { count: draftCount }) : t('review.studio.nothingToSend') }}
        </AppButton>
        <template v-if="canManage">
            <AppButton variant="secondary" is-block v-if="current?.role === 'parent'" :to="`/books/${book.id}/translate`">
                <AppIcon name="languages" :size="22" />{{ t('studio.translateBook') }}
            </AppButton>
            <AppButton variant="secondary" tone="mint" is-block v-if="!isRestricted" :disabled="!isComplete || isRecording" @click="publish">
                <AppIcon v-if="isComplete" name="rocket" :size="22" motion="float" />
                {{ isComplete ? t('studio.publish') : t('studio.recordAll') }}
            </AppButton>
            <AppButton variant="secondary" size="sm" @click="askDelete">{{ t('studio.deleteBook') }}</AppButton>
        </template>
    </div>
    <p v-else class="muted">{{ t('common.loading') }}</p>
</template>

<script setup lang="ts">
const SPEECH_CATEGORIES: { id: SpeechCategory }[] = [
    { id: 'dialogue' },
    { id: 'tone' },
    { id: 'scene' },
]

interface IPendingTake {
    blob: Blob
    mime: string
    ms: number
    url: string
    lineId: string
    language: string
}

const { t, formatDuration } = useI18n()
const languageOptions = computed(() => languageSelectOptions(LANGUAGES, t('studio.chooseLanguage')))
const route = useRoute()
const { get, patch, remove, setLineAudio, clearLineAudio } = useBooks()
const { submit, validateAll, loadComments } = useReview()
const { getById } = useMembers()
const { currentId, current } = useCurrentMember()
const { upload } = useFiles()
const recorder = useRecorder(recording => takeRecording(recording, true))
const { isRecording, elapsedMs, remainingMs, errorMessage, start, stop } = recorder
const player = useAudioPlayer()
const speech = useSpeechAssist()
const wakeLock = useWakeLock()

const book = ref<IBook | null>(null)
const comments = ref<IReviewComment[]>([])
const isRedoOnly = ref(false)
const activeMemberId = ref<string | null>(null)
const currentLineId = ref<string | null>(null)
const language = ref('')
const isBusy = ref(false)
const isPrompter = ref(false)
const pending = ref<IPendingTake | null>(null)
const limitNotice = ref('')
const isPlaying = computed(() => player.isPlaying.value)

const bookId = String(route.params.id)

const isRestricted = computed(() => current.value?.role === 'relative')
const canManage = computed(() => !isRestricted.value || book.value?.kind === 'solo')
const isLanguageChosen = computed(() => language.value !== '')
const isLocked = computed(() => isRecording.value || pending.value !== null || isBusy.value)

const visibleLines = computed(() =>
    (book.value?.lines ?? []).filter(line => !isRestricted.value || line.memberId === currentId.value),
)

const recordingOf = (lineId: string, code: string): ILineRecording | null => {
    return book.value?.recordings.find(item => item.lineId === lineId && item.language === code) ?? null
}

const hasVoice = (line: ILine, code: string): boolean => {
    const recording = recordingOf(line.id, code)
    return recording !== null && recording.status !== 'stale' && recording.status !== 'changes_requested'
}

const isDone = (line: ILine): boolean =>
    line.audioFileId !== null && line.recordingStatus !== 'stale' && line.recordingStatus !== 'changes_requested'

const isStale = (line: ILine): boolean => recordingOf(line.id, language.value)?.status === 'stale'

const needsRedo = (line: ILine): boolean => {
    const status = recordingOf(line.id, language.value)?.status
    return status === 'stale' || status === 'changes_requested'
}

const openCommentsOf = (line: ILine): IReviewComment[] => comments.value.filter(item => item.lineId === line.id && item.resolvedAt === null)

const draftCount = computed(
    () => (book.value?.recordings ?? []).filter(item => item.memberId === currentId.value && item.status === 'draft').length,
)

const setRedoOnly = (value: boolean): void => {
    if (isLocked.value) {
        return
    }
    isRedoOnly.value = value
    const first = memberLines.value[0]
    if (!memberLines.value.some(line => line.id === currentLineId.value) && first) {
        currentLineId.value = first.id
    }
}

const translationOf = (line: ILine): ILineTranslation | null => {
    return book.value?.translations.find(item => item.lineId === line.id && item.language === language.value) ?? null
}

const lineText = (line: ILine): string => translationOf(line)?.text ?? line.text
const lineTone = (line: ILine): string => translationOf(line)?.tone || line.tone

const castIds = computed(() => [...new Set(visibleLines.value.map(line => line.memberId).filter((id): id is string => id !== null))])
const tabs = computed(() =>
    castIds.value
        .map(id => getById(id))
        .filter((member): member is IMember => member !== null)
        .map(member => {
            const own = visibleLines.value.filter(line => line.memberId === member.id)
            const done = own.filter(line => hasVoice(line, language.value)).length
            return { member, hex: memberHex(member), progress: `${done}/${own.length}` }
        }),
)
const activeMember = computed(() => getById(activeMemberId.value))
const activeHex = computed(() => memberHex(activeMember.value))
const activeTone = computed(() => (activeMemberId.value ? (book.value?.tones[activeMemberId.value] ?? '') : ''))
const currentPageDescription = computed(() => book.value?.pages[currentLine.value?.pageIndex ?? -1]?.description ?? '')
const redoCount = computed(() => visibleLines.value.filter(needsRedo).length)
const memberLines = computed(() =>
    visibleLines.value.filter(line => line.memberId === activeMemberId.value && (!isRedoOnly.value || needsRedo(line))),
)
const currentLine = computed(() => memberLines.value.find(line => line.id === currentLineId.value) ?? null)
const currentIndex = computed(() => memberLines.value.findIndex(line => line.id === currentLineId.value))
const nextLine = computed(() => memberLines.value[currentIndex.value + 1] ?? null)
const hasPrevious = computed(() => currentIndex.value > 0)
const hasNext = computed(() => currentIndex.value >= 0 && currentIndex.value < memberLines.value.length - 1)
const currentRecording = computed(() => (currentLine.value ? recordingOf(currentLine.value.id, language.value) : null))
const recordedCount = computed(() => visibleLines.value.filter(line => hasVoice(line, language.value)).length)
const isComplete = computed(() => book.value !== null && book.value.lines.every(isDone))
const progressPercent = computed(() => `${Math.round((recordedCount.value / Math.max(1, visibleLines.value.length)) * 100)}%`)
const progressValue = computed(() => Number.parseInt(progressPercent.value, 10))
const timeLabel = computed(() => formatDuration(isRecording.value ? elapsedMs.value : (currentRecording.value?.durationMs ?? 0)))
const coverageLanguages = computed(() => {
    const codes = [book.value?.language ?? DEFAULT_LANGUAGE, language.value, ...(book.value?.recordings ?? []).map(item => item.language), ...(book.value?.translations ?? []).map(item => item.language)]
    return [...new Set(codes.filter(code => code !== ''))]
})
const hint = computed(() => {
    if (isRecording.value) {
        return t('studio.hints.finish')
    }
    if (pending.value) {
        return t('studio.hints.pending')
    }
    if (!isLanguageChosen.value) {
        return t('studio.hints.chooseLanguage')
    }
    if (currentRecording.value?.status === 'stale') {
        return t('studio.hints.stale')
    }
    if (currentRecording.value?.status === 'changes_requested') {
        return t('review.studio.hintChanges')
    }
    return currentRecording.value ? t('studio.hints.recorded') : t('studio.hints.tapMic')
})

const memberName = (memberId: string): string => getById(memberId)?.name ?? t('studio.voice')

const speechParts = (line: ILine): ISpeechParts => ({
    dialogue: lineText(line),
    tone: [activeTone.value, line.note, lineTone(line)].filter(part => part.trim() !== '').join('. '),
    scene: [currentPageDescription.value, line.sceneDescription].filter(part => part.trim() !== '').join('. '),
})

const assistCurrentLine = async (): Promise<void> => {
    if (currentLine.value && speech.isEnabled.value && !isRecording.value) {
        await speech.speak(speechParts(currentLine.value), language.value || DEFAULT_LANGUAGE)
    }
}

const toggleAssist = (): void => {
    speech.toggle()
    if (speech.isEnabled.value) {
        void assistCurrentLine()
    }
}

const togglePrompter = (): void => {
    isPrompter.value = !isPrompter.value
}

const selectMember = (memberId: string): void => {
    if (isLocked.value) {
        return
    }
    player.stop()
    activeMemberId.value = memberId
    const own = visibleLines.value.filter(line => line.memberId === memberId)
    currentLineId.value = (own.find(line => !hasVoice(line, language.value)) ?? own[0])?.id ?? null
}

const goRelative = (step: number): void => {
    const target = memberLines.value[currentIndex.value + step]
    if (target && !isLocked.value) {
        player.stop()
        currentLineId.value = target.id
    }
}

const jumpTo = (lineId: string, code: string): void => {
    const line = visibleLines.value.find(item => item.id === lineId)
    if (!line || line.memberId === null || isLocked.value) {
        return
    }
    player.stop()
    language.value = code
    activeMemberId.value = line.memberId
    currentLineId.value = line.id
    window.scrollTo({ top: 0, behavior: 'smooth' })
}

const goToNextLine = (fromId: string): void => {
    const lines = memberLines.value
    const index = lines.findIndex(line => line.id === fromId)
    const after = lines.slice(index + 1).find(line => !hasVoice(line, language.value))
    const anywhere = lines.find(line => !hasVoice(line, language.value))
    const next = after ?? anywhere
    if (next) {
        currentLineId.value = next.id
    }
}

const discardPending = (): void => {
    if (pending.value) {
        URL.revokeObjectURL(pending.value.url)
        pending.value = null
    }
}

function takeRecording(recording: IRecording | null, isLimit: boolean): void {
    const line = currentLine.value
    if (!recording || !line) {
        errorMessage.value = t('studio.tooShort')
        return
    }
    limitNotice.value = isLimit ? t('studio.limitReached', { time: formatDuration(recorder.limitMs.value) }) : ''
    pending.value = { ...recording, url: URL.createObjectURL(recording.blob), lineId: line.id, language: language.value }
}

const toggleRecord = async (): Promise<void> => {
    if (!currentLine.value || !book.value || !isLanguageChosen.value) {
        return
    }
    player.stop()
    if (!isRecording.value) {
        speech.cancel()
        limitNotice.value = ''
        if (await start()) {
            void wakeLock.request()
        }
        return
    }
    takeRecording(await stop(), false)
}

const sendTake = async (): Promise<void> => {
    const take = pending.value
    if (!take || isBusy.value) {
        return
    }
    isBusy.value = true
    errorMessage.value = ''
    try {
        const fileId = await upload(take.blob, take.mime)
        await setLineAudio(bookId, take.lineId, fileId, take.ms, take.language)
        book.value = await get(bookId)
        discardPending()
        limitNotice.value = ''
        if (isRestricted.value && visibleLines.value.every(line => hasVoice(line, take.language))) {
            await sendDrafts()
        }
        comments.value = await loadComments(bookId)
        goToNextLine(take.lineId)
    } catch (error) {
        console.error('L enregistrement n a pas pu être sauvegardé', error)
        errorMessage.value = t('studio.saveFailed')
    } finally {
        isBusy.value = false
    }
}

const cancelTake = (): void => {
    discardPending()
    limitNotice.value = ''
    errorMessage.value = ''
}

const listen = async (): Promise<void> => {
    const recording = currentRecording.value
    if (!recording) {
        return
    }
    if (isPlaying.value) {
        player.stop()
        return
    }
    await player.play(recording.fileId)
}

const redo = async (): Promise<void> => {
    const line = currentLine.value
    if (!line) {
        return
    }
    player.stop()
    try {
        await clearLineAudio(bookId, line.id, language.value)
        book.value = await get(bookId)
    } catch (error) {
        console.error('L enregistrement n a pas pu être effacé', error)
    }
}

const sendDrafts = async (): Promise<void> => {
    await submit(bookId)
    book.value = await get(bookId)
}

const sendForReview = async (): Promise<void> => {
    isBusy.value = true
    errorMessage.value = ''
    try {
        await sendDrafts()
    } catch (error) {
        console.error('Les prises n ont pas pu être envoyées', error)
        errorMessage.value = t('review.studio.sendError')
    } finally {
        isBusy.value = false
    }
}

const publish = async (): Promise<void> => {
    try {
        await validateAll(bookId)
        await navigateTo(`/books/${bookId}/play`)
    } catch (error) {
        console.error('Le livre n a pas pu être publié', error)
    }
}

const askDelete = async (): Promise<void> => {
    if (!book.value || !window.confirm(t('studio.confirmDelete', { title: book.value.title }))) {
        return
    }
    try {
        await remove(bookId)
        await navigateTo('/home')
    } catch (error) {
        console.error('Le livre n a pas pu être supprimé', error)
    }
}

watch(
    () => isPrompter.value || isRecording.value,
    isWanted => {
        void (isWanted ? wakeLock.request() : wakeLock.release())
    },
)

watch(currentLineId, () => {
    if (speech.isEnabled.value && !isRecording.value && pending.value === null) {
        void assistCurrentLine()
    }
})

watch(language, () => {
    if (activeMemberId.value && !isLocked.value) {
        const own = memberLines.value
        if (!own.some(line => line.id === currentLineId.value)) {
            currentLineId.value = own[0]?.id ?? null
        }
    }
})

onBeforeUnmount(() => {
    discardPending()
    if (isRestricted.value && draftCount.value > 0) {
        submit(bookId).catch(error => console.error('Les prises n ont pas pu être envoyées en quittant le studio', error))
    }
})

onMounted(async () => {
    try {
        book.value = await get(bookId)
        comments.value = await loadComments(bookId).catch(() => [])
        const bookLanguage = book.value.language || DEFAULT_LANGUAGE
        const spoken = (current.value?.spokenLanguages ?? []).filter(code => LANGUAGES.some(item => item.code === code))
        language.value = spoken.length === 0 || spoken.includes(bookLanguage) ? bookLanguage : spoken[0]!
        const mine = castIds.value.includes(currentId.value ?? '') ? currentId.value : castIds.value[0]
        if (mine) {
            selectMember(mine)
        }
    } catch (error) {
        console.error('Le livre n a pas pu être chargé', error)
        await navigateTo('/home')
    }
})
</script>

<style scoped>
.studio__chip {
    min-height: 44px;
}

.studio__redo {
    background: var(--coral);
}

.stage {
    border: 3px solid var(--ink);
    border-radius: 24px;
    box-shadow: var(--shadow);
    padding: 16px;
    display: grid;
    gap: 14px;
}

.stage__text {
    margin: 0;
    font: 700 1.375rem/1.4 var(--font-body);
    overflow-wrap: anywhere;
}

.stage__next {
    margin: 0;
    font-weight: 700;
    color: var(--ink-soft);
}

.stage__audio {
    width: 100%;
    max-width: 420px;
}

.hint {
    font-weight: 700;
    font-size: 0.875rem;
    background: rgba(255, 255, 255, 0.6);
    border-radius: 10px;
    padding: 6px 10px;
}

.stage--prompter {
    position: fixed;
    inset: 0;
    z-index: 100;
    overflow-y: auto;
    border-radius: 0;
    border-width: 0;
    box-shadow: none;
    padding: max(16px, env(safe-area-inset-top)) 16px max(16px, env(safe-area-inset-bottom));
    align-content: start;
}

.stage--prompter .stage__text {
    font-size: clamp(30px, 7vw, 64px);
    line-height: 1.25;
}

.stage--prompter .hint {
    font-size: clamp(16px, 2.6vw, 24px);
}

.stage--prompter .btn,
.stage--prompter .chip {
    min-height: 48px;
}

@media (orientation: landscape) and (min-width: 700px) {
    .stage--prompter {
        grid-template-columns: minmax(0, 1fr) 320px;
        grid-template-areas:
            'bar controls'
            'script controls';
        align-items: start;
    }

    .stage--prompter .stage__script {
        grid-area: script;
    }

    .stage--prompter .stage__controls {
        grid-area: controls;
        position: sticky;
        top: 0;
    }

    .stage--prompter .stage__bar {
        grid-area: bar;
    }
}

.rec {
    width: 96px;
    height: 96px;
    border-radius: 50%;
    border: 4px solid var(--ink);
    background: var(--coral);
    box-shadow: 5px 5px 0 var(--ink);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--paper);
}

.rec:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.rec--on {
    box-shadow: 0 0 0 8px var(--cream), 0 0 0 11px var(--coral), 5px 5px 0 11px var(--ink);
}
</style>
