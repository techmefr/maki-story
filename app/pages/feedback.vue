<template>
    <div class="stack narrow">
        <BackLink to="/family" />
        <h1 class="title">{{ t('feedback.title') }}</h1>
        <AppEmpty v-if="entries.length === 0" :title="t('feedback.empty')" :hint="t('feedback.emptyHint')" />
        <div v-for="entry in entries" :key="entry.id" class="card stack" style="gap: 6px">
            <div class="row row--wrap">
                <span class="badge" :style="{ background: moodColor(entry.mood) }">{{ moodLabel(entry.mood) }}</span>
                <span class="muted">{{ entry.memberName }} · {{ entry.screen }}</span>
            </div>
            <div v-if="entry.text">{{ entry.text }}</div>
            <div class="muted">{{ formatDateTime(entry.createdAt) }}</div>
        </div>
    </div>
</template>

<script setup lang="ts">
const MOOD_KEYS: Record<FeedbackMood, string> = { love: 'feedback.moods.love', ok: 'feedback.moods.ok', bad: 'feedback.moods.bad' }
const MOOD_COLORS: Record<FeedbackMood, string> = { love: '#4AD3A5', ok: '#FFC933', bad: '#FF7766' }

const { t, formatDateTime } = useI18n()
const { list } = useFeedback()
const entries = ref<IFeedback[]>([])

const moodLabel = (mood: FeedbackMood | null): string => t(mood ? MOOD_KEYS[mood] : 'feedback.note')
const moodColor = (mood: FeedbackMood | null): string => (mood ? MOOD_COLORS[mood] : '#FFF3DC')

onMounted(async () => {
    try {
        entries.value = await list()
    } catch (error) {
        console.error('Impossible de charger les avis pour le moment', error)
    }
})
</script>
