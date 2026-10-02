<template>
    <div>
        <AppButton variant="secondary" size="sm" @click="open"><AppIcon name="smile" :size="18" />{{ t('feedback.button') }}</AppButton>
        <div v-if="isOpen" class="sheet-backdrop" @click.self="close">
            <div v-sheet="close" class="sheet stack" role="dialog" aria-modal="true" aria-labelledby="feedback-title">
                <h2 id="feedback-title" class="subtitle">{{ t('feedback.sheetTitle') }}</h2>
                <div class="row row--wrap" role="group" :aria-label="t('feedback.mood')">
                    <AppButton size="sm"
                        v-for="option in moods"
                        :key="option.value"
                        class="grow"
                        :aria-pressed="mood === option.value"
                        :style="{ background: mood === option.value ? option.color : '#fff' }"
                        @click="mood = option.value">
                        {{ t(option.labelKey) }}
                    </AppButton>
                </div>
                <textarea v-model="text" class="input" :aria-label="t('feedback.label')" :placeholder="t('feedback.placeholder')" />
                <div v-if="isSent" class="muted" role="status">{{ t('feedback.thanks') }}</div>
                <AppButton is-block :disabled="!canSend" @click="send">{{ t('common.send') }}</AppButton>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
const moods: { value: FeedbackMood; labelKey: string; color: string }[] = [
    { value: 'love', labelKey: 'feedback.moods.love', color: '#4CD4A8' },
    { value: 'ok', labelKey: 'feedback.moods.ok', color: '#FFC940' },
    { value: 'bad', labelKey: 'feedback.moods.bad', color: '#FF7A6B' },
]
const CLOSE_DELAY_MS = 1200

const { t } = useI18n()
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
