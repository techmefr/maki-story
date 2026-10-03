<template>
    <section class="rec" data-testid="message-recorder">
        <p class="rec__hint">{{ hint }}</p>
        <div class="rec__stage" aria-hidden="true">
            <span v-if="isRecording" class="rec__halo" />
            <span class="rec__mic" :class="{ 'rec__mic--on': isRecording }"><AppIcon name="mic" :size="52" /></span>
        </div>
        <MessageBars :active="isRecording" class="rec__bars" :class="{ 'rec__bars--hidden': !isRecording }" />
        <div class="rec__time" role="timer" :aria-label="t('messages.compose.duration', { time: timeLabel })">{{ timeLabel }}</div>
        <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
        <AppButton
            :variant="isRecording ? 'primary' : isDone ? 'secondary' : 'destructive'"
            :class="{ 'rec__again': isDone && !isRecording }"
            :icon="isRecording ? 'stop' : isDone ? 'redo' : 'mic'"
            is-block
            data-testid="message-record"
            @click="emit('toggle')"
        >
            {{ isRecording ? t('messages.compose.stop') : isDone ? t('messages.compose.again') : t('messages.compose.record') }}
        </AppButton>
        <div v-if="isDone && !isRecording" class="rec__done">
            <AppButton variant="secondary" :tone="isPreviewing ? 'mint' : 'sky'" icon="play" :aria-label="t('messages.compose.listenBackLabel')" @click="emit('preview')">
                {{ t('messages.compose.listenBack') }}
            </AppButton>
            <AppButton variant="secondary" tone="mint" icon="send" :loading="isBusy" data-testid="message-send" @click="emit('send')">
                {{ t('common.send') }}
            </AppButton>
        </div>
    </section>
</template>

<script setup lang="ts">
const props = defineProps<{
    isRecording: boolean
    isDone: boolean
    isBusy: boolean
    isPreviewing: boolean
    elapsedMs: number
    hint: string
    errorMessage: string
}>()
const emit = defineEmits<{ toggle: []; preview: []; send: [] }>()

const { t, formatDuration } = useI18n()

const timeLabel = computed(() => formatDuration(props.elapsedMs / 1000))
</script>

<style scoped>
.rec {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    padding: 24px 16px;
    border: var(--outline) solid var(--ink);
    border-radius: 30px;
    background: var(--paper);
    box-shadow: var(--shadow-lg);
}

.rec__hint {
    margin: 0;
    color: var(--ink-soft);
    font-size: 1.125rem;
    text-align: center;
}

.rec__stage {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 150px;
    height: 150px;
}

.rec__halo {
    position: absolute;
    inset: 0;
    background: color-mix(in srgb, var(--coral) 30%, transparent);
    animation: rec-blob 1.6s ease-in-out infinite;
}

.rec__mic {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 112px;
    height: 112px;
    border: 4px solid var(--ink);
    border-radius: 50%;
    background: var(--yellow);
    color: var(--on-accent);
}

.rec__mic--on {
    background: var(--coral);
}

.rec__bars--hidden {
    visibility: hidden;
}

.rec__time {
    font: 700 1.75rem/1 var(--font-title);
    font-variant-numeric: tabular-nums;
}

.rec :deep(.btn) {
    font-size: 1.3125rem;
}

.rec__again {
    background: var(--paper);
    color: var(--ink);
}

.rec__done {
    display: flex;
    gap: 10px;
    width: 100%;
}

.rec__done > * {
    flex: 1;
}

@keyframes rec-blob {
    0%,
    100% {
        border-radius: 50%;
        transform: scale(1);
    }
    50% {
        border-radius: 45% 55% 42% 58%;
        transform: scale(1.12);
    }
}

@media (prefers-reduced-motion: reduce) {
    .rec__halo {
        animation: none;
        border-radius: 50%;
    }
}
</style>
