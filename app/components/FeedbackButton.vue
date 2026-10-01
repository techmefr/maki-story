<template>
    <div>
        <button type="button" class="btn btn--small btn--white" @click="open"><AppIcon name="smile" :size="18" />Avis</button>
        <div v-if="isOpen" class="sheet-backdrop" @click.self="close">
            <div v-sheet="close" class="sheet stack" role="dialog" aria-modal="true" aria-labelledby="feedback-title">
                <h2 id="feedback-title" class="subtitle">Ton avis sur cet écran</h2>
                <div class="row row--wrap" role="group" aria-label="Ton humeur">
                    <button
                        v-for="option in moods"
                        :key="option.value"
                        type="button"
                        class="btn btn--small grow"
                        :aria-pressed="mood === option.value"
                        :style="{ background: mood === option.value ? option.color : '#fff' }"
                        @click="mood = option.value"
                    >
                        {{ option.label }}
                    </button>
                </div>
                <textarea v-model="text" class="input" aria-label="Ton avis" placeholder="Ce qui marche, ce qui bloque, ce qui manque..." />
                <div v-if="isSent" class="muted" role="status">Merci, c’est noté.</div>
                <button type="button" class="btn btn--block" :disabled="!canSend" @click="send">Envoyer</button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
const moods: { value: FeedbackMood; label: string; color: string }[] = [
    { value: 'love', label: 'J’adore', color: '#4CD4A8' },
    { value: 'ok', label: 'Ça va', color: '#FFC940' },
    { value: 'bad', label: 'Pas clair', color: '#FF7A6B' },
]
const CLOSE_DELAY_MS = 1200

const route = useRoute()
const { current } = useCurrentMember()
const { send: sendFeedback } = useFeedback()

const isOpen = ref(false)
const isSent = ref(false)
const mood = ref<FeedbackMood | null>(null)
const text = ref('')

const canSend = computed(() => mood.value !== null || text.value.trim() !== '')

const open = (): void => {
    mood.value = null
    text.value = ''
    isSent.value = false
    isOpen.value = true
}

const close = (): void => {
    isOpen.value = false
}

const send = async (): Promise<void> => {
    try {
        await sendFeedback({
            memberName: current.value?.name ?? '',
            screen: route.path,
            mood: mood.value,
            text: text.value,
        })
        isSent.value = true
        setTimeout(close, CLOSE_DELAY_MS)
    } catch (error) {
        console.error('L avis n a pas pu etre envoye', error)
    }
}
</script>
