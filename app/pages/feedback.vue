<template>
    <div class="stack narrow">
        <NuxtLink to="/family" class="muted">Retour</NuxtLink>
        <h1 class="title">Avis des testeurs</h1>
        <p v-if="entries.length === 0" class="muted">Aucun avis pour l’instant.</p>
        <div v-for="entry in entries" :key="entry.id" class="card stack" style="gap: 6px">
            <div class="row row--wrap">
                <span class="badge" :style="{ background: moodColor(entry.mood) }">{{ moodLabel(entry.mood) }}</span>
                <span class="muted">{{ entry.memberName }} · {{ entry.screen }}</span>
            </div>
            <div v-if="entry.text">{{ entry.text }}</div>
            <div class="muted">{{ formatDate(entry.createdAt) }}</div>
        </div>
    </div>
</template>

<script setup lang="ts">
const MOOD_LABELS: Record<FeedbackMood, string> = { love: 'J’adore', ok: 'Ça va', bad: 'Pas clair' }
const MOOD_COLORS: Record<FeedbackMood, string> = { love: '#4CD4A8', ok: '#FFC940', bad: '#FF7A6B' }

const { list } = useFeedback()
const entries = ref<IFeedback[]>([])

const moodLabel = (mood: FeedbackMood | null): string => (mood ? MOOD_LABELS[mood] : 'Note')
const moodColor = (mood: FeedbackMood | null): string => (mood ? MOOD_COLORS[mood] : '#FFF4D9')
const formatDate = (iso: string): string => new Date(iso).toLocaleString('fr-FR')

onMounted(async () => {
    try {
        entries.value = await list()
    } catch (error) {
        console.error('Impossible de charger les avis pour le moment', error)
    }
})
</script>
