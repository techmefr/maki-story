<template>
    <div class="stack center screen" :class="{ kid: isChild }" :style="{ background: target ? memberHexLight(target) : '#FFF4D9' }">
        <template v-if="target">
            <AppAvatar :member="target" :size="120" />
            <h1 class="title">{{ heading }}</h1>
            <template v-if="phase === 'sent'">
                <AppMaki :size="100" />
                <div class="subtitle row"><AppIcon name="party" :size="28" motion="bounce" is-active />{{ t('messages.compose.sent') }}</div>
            </template>
            <template v-else>
                <WaveBars :is-active="isRecording" color="#1F1B3A" />
                <div class="subtitle">{{ timeLabel }}</div>
                <button
                    v-if="phase !== 'done'"
                    type="button"
                    class="rec"
                    :class="{ 'rec--on': isRecording }"
                    :aria-label="isRecording ? t('messages.compose.stop') : t('messages.compose.record')"
                    @click="toggle"
                >
                    <AppIcon :name="isRecording ? 'stop' : 'mic'" :size="56" :motion="isRecording ? 'pulse' : 'none'" />
                </button>
                <div v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</div>
                <div v-if="phase === 'done'" class="row">
                    <AppButton variant="secondary" @click="redo"><AppIcon name="redo" :size="22" />{{ t('messages.compose.redo') }}</AppButton>
                    <AppButton variant="secondary" tone="mint" :disabled="isBusy" @click="send"><AppIcon name="send" :size="22" motion="nudge" />{{ t('common.send') }}</AppButton>
                </div>
                <div v-else class="muted">{{ isRecording ? t('messages.compose.tapToFinish') : t('messages.compose.tapMic') }}</div>
            </template>
            <AppButton variant="secondary" size="sm" :to="backPath">{{ t('common.back') }}</AppButton>
        </template>
    </div>
</template>

<script setup lang="ts">
const BACK_DELAY_MS = 1600

definePageMeta({ layout: 'blank' })

const { t, formatDuration } = useI18n()
const route = useRoute()
const { getById } = useMembers()
const { currentId, isChild } = useCurrentMember()
const { send: sendMessage } = useMessages()
const { upload } = useFiles()
const { isRecording, elapsedMs, errorMessage, start, stop } = useRecorder()

const phase = ref<'idle' | 'done' | 'sent'>('idle')
const isBusy = ref(false)
const recording = ref<IRecording | null>(null)

const target = computed(() => getById(String(route.params.toId)))
const backPath = computed(() => (isChild.value ? `/kid/${target.value?.id}` : '/messages'))
const kind = computed<MessageKind>(() => (route.query.kind === 'birthday' ? 'BIRTHDAY' : 'NORMAL'))
const heading = computed(() =>
    kind.value === 'BIRTHDAY' ? t('messages.compose.birthdayFor', { name: target.value?.name ?? '' }) : t('messages.compose.messageFor', { name: target.value?.name ?? '' }),
)
const timeLabel = computed(() => formatDuration((phase.value === 'done' ? (recording.value?.ms ?? 0) : elapsedMs.value) / 1000))

const toggle = async (): Promise<void> => {
    if (!isRecording.value) {
        await start()
        return
    }
    const result = await stop()
    if (!result) {
        errorMessage.value = t('messages.compose.tooShort')
        return
    }
    recording.value = result
    phase.value = 'done'
}

watch(elapsedMs, async ms => {
    if (isRecording.value && ms >= MESSAGE_MAX_DURATION_MS) {
        await toggle()
    }
})

const redo = (): void => {
    recording.value = null
    phase.value = 'idle'
}

const send = async (): Promise<void> => {
    if (!recording.value || !currentId.value || !target.value) {
        return
    }
    isBusy.value = true
    try {
        const fileId = await upload(recording.value.blob, recording.value.mime)
        await sendMessage({
            fromMemberId: currentId.value,
            toMemberId: target.value.id,
            fileId,
            mime: recording.value.mime,
            durationMs: recording.value.ms,
            kind: kind.value,
        })
        phase.value = 'sent'
        setTimeout(() => navigateTo(isChild.value ? '/kid' : '/messages'), BACK_DELAY_MS)
    } catch (error) {
        console.error('Le message n a pas pu être envoyé', error)
        errorMessage.value = errorText(error, 'messages.compose.sendFailed')
    } finally {
        isBusy.value = false
    }
}
</script>

<style scoped>
.screen {
    min-height: 100dvh;
    position: fixed;
    inset: 0;
    z-index: 40;
    justify-content: safe center;
    overflow-y: auto;
    padding: 16px;
}

.rec {
    width: 120px;
    height: 120px;
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
