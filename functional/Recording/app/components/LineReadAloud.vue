<template>
    <div v-if="!isChild && text.trim() !== ''" class="read-aloud stack">
        <AppButton
            variant="secondary"
            size="sm"
            :aria-pressed="isSpeaking"
            :aria-describedby="isMissing ? messageId : undefined"
            data-testid="read-aloud"
            @click="toggle">
            <AppIcon :name="isSpeaking ? 'stop' : 'volume'" :size="18" />
            {{ isSpeaking ? t('readAloud.stop') : t('readAloud.play') }}
        </AppButton>
        <p v-if="isMissing" :id="messageId" class="hint" role="status" data-testid="read-aloud-missing">{{ t('readAloud.missing') }}</p>
    </div>
</template>

<script setup lang="ts">
const props = defineProps<{
    lineId: string
    text: string
    language: string
}>()

const { t } = useI18n()
const { isChild } = useCurrentMember()
const { speakingId, speak, stop } = useLineVoice()

const isMissing = ref(false)
const messageId = computed(() => `read-aloud-missing-${props.lineId}`)
const isSpeaking = computed(() => speakingId.value === props.lineId)

const toggle = async (): Promise<void> => {
    if (isSpeaking.value) {
        stop()
        return
    }
    isMissing.value = false
    isMissing.value = !(await speak(props.lineId, props.text, props.language))
}

watch(() => [props.lineId, props.text, props.language], () => {
    isMissing.value = false
    if (isSpeaking.value) {
        stop()
    }
})
</script>
