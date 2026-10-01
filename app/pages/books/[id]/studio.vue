<template>
    <div class="stack narrow" v-if="book">
        <NuxtLink to="/home" class="muted">Retour</NuxtLink>
        <h1 class="title">{{ book.title }}</h1>
        <div class="row">
            <div class="progress grow"><div class="progress__fill" :style="{ width: progressPercent }" /></div>
            <span class="badge">{{ recordedCount }}/{{ visibleLines.length }}</span>
        </div>
        <div class="stack">
            <label class="label" for="studio-language">Langue de l’enregistrement</label>
            <select id="studio-language" v-model="language" required :disabled="isLocked">
                <option value="">Choisis une langue</option>
                <option v-for="option in LANGUAGES" :key="option.code" :value="option.code">{{ option.flag }} {{ option.label }}</option>
            </select>
            <p v-if="!isLanguageChosen" class="error" role="alert">Choisis la langue avant d’enregistrer.</p>
        </div>
        <div class="row row--wrap">
            <button
                v-for="tab in tabs"
                :key="tab.member.id"
                type="button"
                class="picker"
                :disabled="isLocked"
                :style="{ background: tab.member.id === activeMemberId ? tab.hex : '#fff' }"
                @click="selectMember(tab.member.id)"
            >
                <AppAvatar :member="tab.member" :size="28" />
                <span>{{ tab.member.name }} {{ tab.progress }}</span>
            </button>
        </div>
        <section
            v-if="currentLine"
            class="stage"
            :class="{ 'stage--prompter': isPrompter }"
            :style="{ background: activeHex }"
            aria-label="Prompteur"
        >
            <div class="stage__bar row row--wrap">
                <button type="button" class="btn btn--white btn--small" :aria-pressed="isPrompter" @click="togglePrompter">
                    <AppIcon :name="isPrompter ? 'close' : 'eye'" :size="18" />
                    {{ isPrompter ? 'Quitter le prompteur' : 'Prompteur' }}
                </button>
                <button
                    v-if="speech.isAvailable.value"
                    type="button"
                    class="btn btn--white btn--small"
                    :aria-pressed="speech.isEnabled.value"
                    aria-label="Aide vocale"
                    @click="toggleAssist"
                >
                    <AppIcon :name="speech.isEnabled.value ? 'volume' : 'mute'" :size="18" />
                    {{ speech.isEnabled.value ? 'Aide vocale activée' : 'Aide vocale coupée' }}
                </button>
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
                    {{ category.label }}
                </button>
                <button type="button" class="btn btn--white btn--small" :disabled="isRecording" @click="assistCurrentLine">
                    <AppIcon name="ear" :size="18" />
                    Relire l’aide
                </button>
            </div>
            <div class="stage__script stack">
                <div class="label">{{ currentLine.character || 'Narrateur' }} · réplique {{ currentIndex + 1 }}/{{ memberLines.length }}</div>
                <p class="stage__text" data-testid="teleprompter-text">{{ lineText(currentLine) }}</p>
                <div v-if="book.imageDesc" class="hint">Image : {{ book.imageDesc }}</div>
                <div v-if="activeTone" class="hint">Ton de la voix : {{ activeTone }}</div>
                <div v-if="currentLine.note" class="hint">Indication : {{ currentLine.note }}</div>
                <div v-if="lineTone(currentLine)" class="hint">Ton : {{ lineTone(currentLine) }}</div>
                <div v-if="currentLine.sceneDescription" class="hint">Scène : {{ currentLine.sceneDescription }}</div>
                <div v-if="currentPageDescription" class="hint">Page : {{ currentPageDescription }}</div>
                <p v-if="nextLine" class="stage__next">Ensuite : {{ lineText(nextLine) }}</p>
            </div>
            <div class="stage__controls stack center">
                <WaveBars :is-active="isRecording" :color="activeHex" />
                <div class="subtitle" role="timer">{{ timeLabel }}</div>
                <div v-if="isRecording" class="badge" data-testid="countdown">Reste {{ formatDuration(remainingMs) }}</div>
                <p v-if="limitNotice" class="error" role="status">{{ limitNotice }}</p>
                <template v-if="pending">
                    <p class="label">Écoute ta prise avant de l’envoyer</p>
                    <audio class="stage__audio" :src="pending.url" controls aria-label="Prise à écouter" />
                    <div class="row row--wrap">
                        <button type="button" class="btn btn--mint btn--small" :disabled="isBusy" @click="sendTake">
                            <AppIcon name="send" :size="18" />
                            {{ isBusy ? 'Envoi…' : 'Envoyer' }}
                        </button>
                        <button type="button" class="btn btn--white btn--small" :disabled="isBusy" @click="cancelTake">
                            <AppIcon name="close" :size="18" />
                            Annuler
                        </button>
                    </div>
                </template>
                <button
                    v-else
                    type="button"
                    class="rec"
                    :class="{ 'rec--on': isRecording }"
                    :disabled="isBusy || !isLanguageChosen"
                    :aria-label="isRecording ? 'Arrêter' : 'Enregistrer'"
                    @click="toggleRecord"
                >
                    <AppIcon :name="isRecording ? 'stop' : 'mic'" :size="44" :motion="isRecording ? 'pulse' : 'none'" />
                </button>
                <div class="muted">{{ hint }}</div>
                <div v-if="errorMessage" class="error">{{ errorMessage }}</div>
                <div class="row row--wrap">
                    <button type="button" class="btn btn--white btn--small" :disabled="isLocked || !hasPrevious" @click="goRelative(-1)">
                        <AppIcon name="skip-back" :size="18" />
                        Précédente
                    </button>
                    <button type="button" class="btn btn--white btn--small" :disabled="isLocked || !hasNext" @click="goRelative(1)">
                        Suivante
                        <AppIcon name="skip-forward" :size="18" />
                    </button>
                </div>
                <div class="row row--wrap">
                    <button type="button" class="btn btn--white btn--small" :disabled="!currentRecording || isLocked" @click="listen">
                        <AppIcon :name="isPlaying ? 'stop' : 'volume'" :size="18" />
                        {{ isPlaying ? 'Stop' : 'Écouter' }}
                    </button>
                    <button type="button" class="btn btn--white btn--small" :disabled="!currentRecording || isLocked" @click="redo">
                        <AppIcon name="redo" :size="18" />
                        Refaire
                    </button>
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
                <span class="dot" :style="{ background: hasVoice(line, language) ? activeHex : '#fff' }" />
                <span class="grow">{{ lineText(line) }}</span>
            </button>
        </div>
        <p v-else class="muted">Cette voix n’a pas de réplique à enregistrer.</p>
        <CoverageTable
            v-if="visibleLines.length > 0"
            :lines="visibleLines"
            :recordings="book.recordings"
            :languages="coverageLanguages"
            :get-member-name="memberName"
            @select="jumpTo"
        />
        <template v-if="!isRestricted">
            <button type="button" class="btn btn--mint btn--block" :disabled="!isComplete || isRecording" @click="publish">
                <AppIcon v-if="isComplete" name="rocket" :size="22" motion="float" />
                {{ isComplete ? 'Publier le livre' : 'Enregistre toutes les répliques pour publier' }}
            </button>
            <button type="button" class="btn btn--white btn--small" @click="askDelete">Supprimer ce livre</button>
        </template>
    </div>
    <p v-else class="muted">Chargement…</p>
</template>

<script setup lang="ts">
const SPEECH_CATEGORIES: { id: SpeechCategory; label: string }[] = [
    { id: 'dialogue', label: 'Réplique' },
    { id: 'tone', label: 'Ton' },
    { id: 'scene', label: 'Scène' },
]

interface IPendingTake {
    blob: Blob
    mime: string
    ms: number
    url: string
    lineId: string
    language: string
}

const route = useRoute()
const { get, patch, remove, setLineAudio, clearLineAudio } = useBooks()
const { getById } = useMembers()
const { currentId, current } = useCurrentMember()
const { upload } = useFiles()
const recorder = useRecorder(recording => takeRecording(recording, true))
const { isRecording, elapsedMs, remainingMs, errorMessage, start, stop } = recorder
const player = useAudioPlayer()
const speech = useSpeechAssist()
const wakeLock = useWakeLock()

const book = ref<IBook | null>(null)
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
    return recording !== null && recording.status !== 'stale'
}

const isDone = (line: ILine): boolean => line.audioFileId !== null && line.recordingStatus !== 'stale'

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
const memberLines = computed(() => visibleLines.value.filter(line => line.memberId === activeMemberId.value))
const currentLine = computed(() => memberLines.value.find(line => line.id === currentLineId.value) ?? null)
const currentIndex = computed(() => memberLines.value.findIndex(line => line.id === currentLineId.value))
const nextLine = computed(() => memberLines.value[currentIndex.value + 1] ?? null)
const hasPrevious = computed(() => currentIndex.value > 0)
const hasNext = computed(() => currentIndex.value >= 0 && currentIndex.value < memberLines.value.length - 1)
const currentRecording = computed(() => (currentLine.value ? recordingOf(currentLine.value.id, language.value) : null))
const recordedCount = computed(() => visibleLines.value.filter(line => hasVoice(line, language.value)).length)
const isComplete = computed(() => book.value !== null && book.value.lines.every(isDone))
const progressPercent = computed(() => `${Math.round((recordedCount.value / Math.max(1, visibleLines.value.length)) * 100)}%`)
const timeLabel = computed(() => formatDuration(isRecording.value ? elapsedMs.value : (currentRecording.value?.durationMs ?? 0)))
const coverageLanguages = computed(() => {
    const codes = [book.value?.language ?? DEFAULT_LANGUAGE, language.value, ...(book.value?.recordings ?? []).map(item => item.language), ...(book.value?.translations ?? []).map(item => item.language)]
    return [...new Set(codes.filter(code => code !== ''))]
})
const hint = computed(() => {
    if (isRecording.value) {
        return 'Touche pour finir'
    }
    if (pending.value) {
        return 'Envoie cette prise ou annule pour recommencer'
    }
    if (!isLanguageChosen.value) {
        return 'Choisis la langue d’abord'
    }
    if (currentRecording.value?.status === 'stale') {
        return 'À refaire (texte modifié)'
    }
    return currentRecording.value ? 'Enregistré' : 'Touche le micro'
})

const memberName = (memberId: string): string => getById(memberId)?.name ?? 'Voix'

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
        errorMessage.value = 'Trop court, recommence.'
        return
    }
    limitNotice.value = isLimit ? `Durée maximale atteinte (${formatDuration(recorder.limitMs.value)}). La prise a été arrêtée.` : ''
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
        goToNextLine(take.lineId)
    } catch (error) {
        console.error('L enregistrement n a pas pu être sauvegardé', error)
        errorMessage.value = 'L’enregistrement n’a pas pu être sauvegardé. Réessaie.'
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

const publish = async (): Promise<void> => {
    try {
        await patch(bookId, { status: 'ready' })
        await navigateTo(`/books/${bookId}/play`)
    } catch (error) {
        console.error('Le livre n a pas pu être publié', error)
    }
}

const askDelete = async (): Promise<void> => {
    if (!book.value || !window.confirm(`Supprimer « ${book.value.title} » ?`)) {
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

onBeforeUnmount(discardPending)

onMounted(async () => {
    try {
        book.value = await get(bookId)
        language.value = book.value.language || DEFAULT_LANGUAGE
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
    font: 700 22px/1.4 var(--font-body);
    overflow-wrap: anywhere;
}

.stage__next {
    margin: 0;
    font-weight: 700;
    opacity: 0.7;
}

.stage__audio {
    width: 100%;
    max-width: 420px;
}

.hint {
    font-weight: 700;
    font-size: 14px;
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
