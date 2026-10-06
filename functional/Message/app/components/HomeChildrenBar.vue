<template>
    <section class="bar" :aria-label="t('homeBar.label')">
        <ul class="bar__list" role="list" data-testid="relatives-grid">
            <li v-for="bubble in bubbles" :key="bubble.id" class="bar__item">
                <button
                    type="button"
                    class="bar__bubble"
                    :class="{ 'bar__bubble--live': activeId === bubble.id }"
                    :style="{ '--ring': bubble.ring }"
                    :disabled="isSending || (activeId !== null && activeId !== bubble.id)"
                    :aria-pressed="activeId === bubble.id"
                    :aria-label="activeId === bubble.id ? t('homeBar.stopSend', { name: bubble.name }) : t('homeBar.record', { name: bubble.name })"
                    :data-testid="`home-kid-${bubble.id}`"
                    @click="toggle(bubble.id)"
                >
                    <span class="bar__photo">
                        <AppIcon v-if="bubble.member === null" name="users" :size="40" />
                        <AppAvatar v-else :member="bubble.member" :size="64" />
                    </span>
                    <span class="bar__name">{{ bubble.name }}</span>
                    <span v-if="activeId === bubble.id" class="bar__state">
                        <AppIcon name="stop" :size="16" />{{ formatSeconds(elapsedMs) }}
                    </span>
                    <span v-else class="bar__state">
                        <AppIcon name="mic" :size="16" />{{ bubble.member ? t('homeBar.quota', { count: countFor(bubble.member.id), max: MESSAGE_MAX_ACTIVE }) : t('homeBar.everyone') }}
                    </span>
                </button>
            </li>
        </ul>
        <p v-if="errorMessage" class="bar__error" role="alert">{{ errorMessage }}</p>
        <p v-if="isSending" class="bar__status" role="status" data-testid="home-send-state">{{ t('homeBar.sending') }}</p>
        <ul v-if="results.length > 0" class="bar__results" role="status" data-testid="home-send-results">
            <li v-for="result in results" :key="result.id">{{ t(`homeBar.result.${result.status}`, { name: result.name }) }}</li>
        </ul>
    </section>
</template>

<script setup lang="ts">
type TSendStatus = 'sent' | 'queued' | 'quota' | 'blocked' | 'failed'

interface IBubble {
    id: string
    name: string
    ring: string
    member: IMember | null
}

interface ISendResult {
    id: string
    name: string
    status: TSendStatus
}

const ALL_ID = 'all'

const props = defineProps<{ kids: IMember[]; counts: Record<string, number> }>()
const emit = defineEmits<{ sent: [] }>()

const { t } = useI18n()
const { currentId } = useCurrentMember()
const { sendNow, cancel } = useOutbox()
const { isRecording, elapsedMs, errorMessage, start, stop } = useRecorder()
const { play: playCue } = useSoundCues()

const activeId = ref<string | null>(null)
const isSending = ref(false)
const results = ref<ISendResult[]>([])

const bubbles = computed<IBubble[]>(() => [
    { id: ALL_ID, name: t('homeBar.all'), ring: 'var(--sky)', member: null },
    ...props.kids.map(member => ({ id: member.id, name: member.name, ring: memberHex(member), member })),
])

const countFor = (id: string): number => props.counts[id] ?? 0
const formatSeconds = (ms: number): string => `${Math.floor(ms / 1000)} s`

const statusFromItem = (item: IOutboxItem): TSendStatus => {
    if (item.status === 'sent') {
        return 'sent'
    }
    if (item.status === 'failed') {
        return item.errorStatus === 409 ? 'quota' : item.errorStatus === 403 ? 'blocked' : 'failed'
    }
    return 'queued'
}

const sendTo = async (member: IMember, recording: IRecording): Promise<ISendResult> => {
    if (!currentId.value) {
        return { id: member.id, name: member.name, status: 'failed' }
    }
    if (countFor(member.id) >= MESSAGE_MAX_ACTIVE) {
        return { id: member.id, name: member.name, status: 'quota' }
    }
    try {
        const item = await sendNow({
            kind: 'message',
            label: t('outbox.messageLabel', { name: member.name }),
            blob: recording.blob,
            mime: recording.mime,
            durationMs: recording.ms,
            payload: { fromMemberId: currentId.value, toMemberId: member.id, kind: 'NORMAL' },
        })
        const status = statusFromItem(item)
        if (item.status === 'failed') {
            await cancel(item.id)
        }
        return { id: member.id, name: member.name, status }
    } catch {
        return { id: member.id, name: member.name, status: 'failed' }
    }
}

const toggle = async (id: string): Promise<void> => {
    if (!isRecording.value) {
        results.value = []
        activeId.value = id
        await start()
        if (!isRecording.value) {
            activeId.value = null
        }
        return
    }
    const recording = await stop()
    const targetId = activeId.value
    activeId.value = null
    if (!recording || targetId === null) {
        errorMessage.value = t('messages.compose.tooShort')
        return
    }
    const targets = targetId === ALL_ID ? props.kids : props.kids.filter(member => member.id === targetId)
    isSending.value = true
    const collected: ISendResult[] = []
    for (const member of targets) {
        collected.push(await sendTo(member, recording))
    }
    results.value = collected
    isSending.value = false
    playCue(collected.some(result => result.status !== 'sent' && result.status !== 'queued') ? 'error' : 'success')
    emit('sent')
}

onBeforeUnmount(async () => {
    if (isRecording.value) {
        await stop()
    }
})
</script>

<style scoped>
.bar__list {
    display: flex;
    gap: 16px;
    margin: 0;
    padding: 4px 4px 8px;
    list-style: none;
    overflow-x: auto;
}

.bar__item {
    flex: none;
}

.bar__bubble {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    min-width: 96px;
    min-height: 44px;
    padding: 0;
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    cursor: pointer;
}

.bar__bubble:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.bar__photo {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 4px;
    border: 4px solid var(--ring);
    border-radius: 50%;
}

.bar__bubble--live .bar__photo {
    border-color: var(--danger);
}

.bar__name {
    max-width: 96px;
    overflow-wrap: anywhere;
    font: 700 0.9375rem/1.2 var(--font-title);
}

.bar__state {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: var(--ink-soft);
    font-size: 0.8125rem;
}

.bar__error {
    color: var(--danger);
}

.bar__results {
    margin: 0;
    padding: 0;
    list-style: none;
}

@media (prefers-reduced-motion: no-preference) {
    .bar__bubble--live .bar__photo {
        animation: bar-pulse 1s ease-in-out infinite;
    }
}

@keyframes bar-pulse {
    50% {
        transform: scale(1.06);
    }
}
</style>
