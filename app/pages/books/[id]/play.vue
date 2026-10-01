<template>
    <div v-if="book" class="stack narrow">
        <NuxtLink to="/home" class="link-back"><AppIcon name="back" :size="18" />Retour</NuxtLink>
        <h1 class="title">{{ book.title }}</h1>
        <OfflineToggle :book-id="book.id" />
        <div class="segs" role="group" aria-label="Répliques">
            <button
                v-for="(line, index) in lines"
                :key="line.id"
                type="button"
                class="seg"
                :style="{ flex: Math.max(1, line.audioMs), background: hexOfLine(line), opacity: index <= currentIndex ? 1 : 0.35 }"
                :aria-label="`Réplique ${index + 1}`"
                @click="jumpTo(index)"
            />
        </div>
        <div class="row" style="justify-content: space-between">
            <span class="muted">{{ elapsedLabel }} / {{ totalLabel }}</span>
            <button type="button" class="chip" @click="cycleRate">{{ player.rate.value }}×</button>
        </div>
        <div class="card row" :style="{ background: nowHex }">
            <AppBlob :active="isPlaying" :color="INK_COLOR" :size="48">
                <AppAvatar :member="nowMember" :size="48" />
            </AppBlob>
            <div>
                <div class="subtitle">{{ nowMember?.name }}</div>
                <div class="muted">{{ currentLine?.character }}</div>
            </div>
        </div>
        <div class="row" style="justify-content: center">
            <button type="button" class="btn btn--round btn--white" aria-label="Précédent" @click="previous"><AppIcon name="skip-back" :size="22" /></button>
            <button type="button" class="btn btn--round" style="width: 72px; min-height: 72px" :aria-label="isPlaying ? 'Pause' : 'Lecture'" @click="toggle">
                <AppIcon :name="isPlaying ? 'pause' : 'play'" :size="34" />
            </button>
            <button type="button" class="btn btn--round btn--white" aria-label="Suivant" @click="next"><AppIcon name="skip-forward" :size="22" /></button>
        </div>
        <div class="stack">
            <button
                v-for="(line, index) in lines"
                :key="line.id"
                type="button"
                class="card card--tap"
                :style="{
                    background: index === currentIndex ? hexOfLine(line) : '#fff',
                    fontStyle: line.character === 'Narrateur' ? 'italic' : 'normal',
                }"
                @click="jumpTo(index)"
            >
                {{ line.text }}
            </button>
        </div>
        <NuxtLink :to="`/books/${book.id}/studio`" class="btn btn--white btn--small">Modifier les enregistrements</NuxtLink>
    </div>
    <p v-else class="muted">Chargement…</p>
</template>

<script setup lang="ts">
const RATES = [1, 1.25, 0.75]

const route = useRoute()
const { get } = useBooks()
const { getById } = useMembers()
const player = useAudioPlayer()

const book = ref<IBook | null>(null)
const currentIndex = ref(0)
const isActive = ref(false)

const lines = computed(() => (book.value?.lines ?? []).filter(line => line.audioFileId))
const currentLine = computed(() => lines.value[currentIndex.value] ?? null)
const nowMember = computed(() => getById(currentLine.value?.memberId ?? null))
const nowHex = computed(() => memberHex(nowMember.value))
const isPlaying = computed(() => player.isPlaying.value)
const totalMs = computed(() => lines.value.reduce((sum, line) => sum + line.audioMs, 0))
const elapsedMs = computed(
    () => lines.value.slice(0, currentIndex.value).reduce((sum, line) => sum + line.audioMs, 0) + player.positionMs.value,
)
const elapsedLabel = computed(() => formatDuration(elapsedMs.value))
const totalLabel = computed(() => formatDuration(totalMs.value))

const hexOfLine = (line: ILine): string => memberHex(getById(line.memberId))

const playCurrent = async (): Promise<void> => {
    const line = currentLine.value
    if (!line?.audioFileId) {
        return
    }
    isActive.value = true
    await player.play(line.audioFileId)
}

const jumpTo = async (index: number): Promise<void> => {
    currentIndex.value = Math.max(0, Math.min(lines.value.length - 1, index))
    await playCurrent()
}

const previous = (): Promise<void> => jumpTo(currentIndex.value - (player.positionMs.value > 800 ? 0 : 1))
const next = (): Promise<void> => jumpTo(currentIndex.value + 1)

const toggle = async (): Promise<void> => {
    if (isPlaying.value) {
        player.pause()
        return
    }
    if (isActive.value) {
        await player.resume()
        return
    }
    await playCurrent()
}

const cycleRate = (): void => {
    const index = RATES.indexOf(player.rate.value)
    player.setRate(RATES[(index + 1) % RATES.length] ?? 1)
}

player.onEnded(async () => {
    if (currentIndex.value >= lines.value.length - 1) {
        isActive.value = false
        currentIndex.value = 0
        return
    }
    currentIndex.value += 1
    await playCurrent()
})

onMounted(async () => {
    try {
        book.value = await get(String(route.params.id))
    } catch (error) {
        console.error('Le livre n a pas pu être chargé', error)
        await navigateTo('/home')
    }
})
</script>

<style scoped>
.segs {
    display: flex;
    gap: 4px;
    height: 32px;
}

.seg {
    border: 2px solid var(--ink);
    border-radius: 6px;
    padding: 0;
    cursor: pointer;
}
</style>
