<template>
    <div class="stack narrow" v-if="book">
        <NuxtLink to="/home" class="muted">Retour</NuxtLink>
        <h1 class="title">{{ book.title }}</h1>
        <div class="row">
            <div class="progress grow"><div class="progress__fill" :style="{ width: progressPercent }" /></div>
            <span class="badge">{{ recordedCount }}/{{ book.lines.length }}</span>
        </div>
        <div class="row row--wrap">
            <button
                v-for="tab in tabs"
                :key="tab.member.id"
                type="button"
                class="picker"
                :style="{ background: tab.member.id === activeMemberId ? tab.hex : '#fff' }"
                @click="selectMember(tab.member.id)"
            >
                <AppAvatar :member="tab.member" :size="28" />
                <span>{{ tab.member.name }} {{ tab.progress }}</span>
            </button>
        </div>
        <div v-if="currentLine" class="card stack" :style="{ background: activeHex }">
            <div class="label">{{ currentLine.character || 'Narrateur' }}</div>
            <div class="line-text">{{ currentLine.text }}</div>
            <div v-if="book.imageDesc" class="hint">Image : {{ book.imageDesc }}</div>
            <div v-if="activeTone" class="hint">Ton de la voix : {{ activeTone }}</div>
            <div v-if="currentLine.note" class="hint">Indication : {{ currentLine.note }}</div>
        </div>
        <div v-if="currentLine" class="stack center">
            <WaveBars :is-active="isRecording" :color="activeHex" />
            <div class="subtitle">{{ timeLabel }}</div>
            <button
                type="button"
                class="rec"
                :class="{ 'rec--on': isRecording }"
                :disabled="isBusy"
                :aria-label="isRecording ? 'Arrêter' : 'Enregistrer'"
                @click="toggleRecord"
            >
                <AppIcon :name="isRecording ? 'stop' : 'mic'" :size="44" :motion="isRecording ? 'pulse' : 'none'" />
            </button>
            <div class="muted">{{ hint }}</div>
            <div v-if="errorMessage" class="error">{{ errorMessage }}</div>
            <div class="row">
                <button type="button" class="btn btn--white btn--small" :disabled="!currentLine.audioFileId || isRecording" @click="listen">
                    <AppIcon :name="isPlaying ? 'stop' : 'volume'" :size="18" />
                    {{ isPlaying ? 'Stop' : 'Écouter' }}
                </button>
                <button type="button" class="btn btn--white btn--small" :disabled="!currentLine.audioFileId || isRecording" @click="redo">
                    <AppIcon name="redo" :size="18" />
                    Refaire
                </button>
            </div>
        </div>
        <div v-if="memberLines.length > 0" class="stack">
            <button
                v-for="line in memberLines"
                :key="line.id"
                type="button"
                class="card card--tap row"
                :style="{ background: line.id === currentLineId ? '#FFF4D9' : '#fff' }"
                @click="currentLineId = line.id"
            >
                <span class="dot" :style="{ background: line.audioFileId ? activeHex : '#fff' }" />
                <span class="grow">{{ line.text }}</span>
            </button>
        </div>
        <p v-else class="muted">Cette voix n’a pas de réplique à enregistrer.</p>
        <button type="button" class="btn btn--mint btn--block" :disabled="!isComplete || isRecording" @click="publish">
            <AppIcon v-if="isComplete" name="rocket" :size="22" motion="float" />
            {{ isComplete ? 'Publier le livre' : 'Enregistre toutes les répliques pour publier' }}
        </button>
        <button type="button" class="btn btn--white btn--small" @click="askDelete">Supprimer ce livre</button>
    </div>
    <p v-else class="muted">Chargement…</p>
</template>

<script setup lang="ts">
const route = useRoute()
const { get, patch, remove, setLineAudio, clearLineAudio } = useBooks()
const { getById } = useMembers()
const { currentId } = useCurrentMember()
const { upload } = useFiles()
const { isRecording, elapsedMs, errorMessage, start, stop } = useRecorder()
const player = useAudioPlayer()

const book = ref<IBook | null>(null)
const activeMemberId = ref<string | null>(null)
const currentLineId = ref<string | null>(null)
const isBusy = ref(false)
const isPlaying = computed(() => player.isPlaying.value)

const bookId = String(route.params.id)

const castIds = computed(() => [...new Set((book.value?.lines ?? []).map(line => line.memberId).filter((id): id is string => id !== null))])
const tabs = computed(() =>
    castIds.value
        .map(id => getById(id))
        .filter((member): member is IMember => member !== null)
        .map(member => {
            const own = (book.value?.lines ?? []).filter(line => line.memberId === member.id)
            const done = own.filter(line => line.audioFileId).length
            return { member, hex: memberHex(member), progress: `${done}/${own.length}` }
        }),
)
const activeMember = computed(() => getById(activeMemberId.value))
const activeHex = computed(() => memberHex(activeMember.value))
const activeTone = computed(() => (activeMemberId.value ? (book.value?.tones[activeMemberId.value] ?? '') : ''))
const memberLines = computed(() => (book.value?.lines ?? []).filter(line => line.memberId === activeMemberId.value))
const currentLine = computed(() => memberLines.value.find(line => line.id === currentLineId.value) ?? null)
const recordedCount = computed(() => (book.value?.lines ?? []).filter(line => line.audioFileId).length)
const isComplete = computed(() => book.value !== null && recordedCount.value === book.value.lines.length)
const progressPercent = computed(() => `${book.value ? Math.round((recordedCount.value / Math.max(1, book.value.lines.length)) * 100) : 0}%`)
const timeLabel = computed(() => formatDuration(isRecording.value ? elapsedMs.value : (currentLine.value?.audioMs ?? 0)))
const hint = computed(() => {
    if (isRecording.value) {
        return 'Touche pour finir'
    }
    return currentLine.value?.audioFileId ? 'Enregistré' : 'Touche le micro'
})

const selectMember = (memberId: string): void => {
    if (isRecording.value) {
        return
    }
    player.stop()
    activeMemberId.value = memberId
    const own = (book.value?.lines ?? []).filter(line => line.memberId === memberId)
    currentLineId.value = (own.find(line => !line.audioFileId) ?? own[0])?.id ?? null
}

const replaceLine = (updated: ILine): void => {
    if (!book.value) {
        return
    }
    book.value = { ...book.value, lines: book.value.lines.map(line => (line.id === updated.id ? updated : line)) }
}

const goToNextLine = (): void => {
    const next = memberLines.value.find(line => !line.audioFileId)
    if (next) {
        currentLineId.value = next.id
    }
}

const toggleRecord = async (): Promise<void> => {
    const line = currentLine.value
    if (!line || !book.value) {
        return
    }
    player.stop()
    if (!isRecording.value) {
        await start()
        return
    }
    isBusy.value = true
    try {
        const recording = await stop()
        if (!recording) {
            errorMessage.value = 'Trop court, recommence.'
            return
        }
        const fileId = await upload(recording.blob, recording.mime)
        await setLineAudio(bookId, line.id, fileId, recording.ms)
        replaceLine({ ...line, audioFileId: fileId, audioMs: recording.ms })
        goToNextLine()
    } catch (error) {
        console.error('L enregistrement n a pas pu être sauvegardé', error)
        errorMessage.value = 'L’enregistrement n’a pas pu être sauvegardé. Réessaie.'
    } finally {
        isBusy.value = false
    }
}

const listen = async (): Promise<void> => {
    const line = currentLine.value
    if (!line?.audioFileId) {
        return
    }
    if (isPlaying.value) {
        player.stop()
        return
    }
    await player.play(line.audioFileId)
}

const redo = async (): Promise<void> => {
    const line = currentLine.value
    if (!line) {
        return
    }
    player.stop()
    try {
        await clearLineAudio(bookId, line.id)
        replaceLine({ ...line, audioFileId: null, audioMs: 0 })
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

onMounted(async () => {
    try {
        book.value = await get(bookId)
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
.line-text {
    font: 700 19px/1.4 var(--font-body);
}

.hint {
    font-weight: 700;
    font-size: 14px;
    background: rgba(255, 255, 255, 0.6);
    border-radius: 10px;
    padding: 6px 10px;
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

.rec--on {
    box-shadow: 0 0 0 8px var(--cream), 0 0 0 11px var(--coral), 5px 5px 0 11px var(--ink);
}

</style>
