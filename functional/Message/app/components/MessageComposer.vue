<template>
    <div class="composer" :class="{ 'composer--adult': !isChild, 'composer--kid': isChild, 'kid-world': isChild }" data-testid="message-composer">
        <ChildFoliage v-if="isChild" />
        <header class="composer__head">
            <AppButton variant="secondary" is-round :to="backPath" :aria-label="t('common.back')">
                <AppIcon name="back" :size="26" class="mirror-rtl" />
            </AppButton>
            <h1 class="title composer__title">{{ t('messages.compose.title') }}</h1>
        </header>
        <AppEmpty v-if="isLoaded && recipients.length === 0" kind="messages" :title="t('messages.compose.noRecipients')" :hint="t('messages.compose.noRecipientsHint')" />
        <template v-else-if="selected || isAll">
            <MessageRecipients v-model="selectedId" :recipients="recipients" :has-all="canAll" :disabled="isBusy" @update:model-value="onSelect" />
            <AppChip v-if="canWish" class="composer__wish" :selected="kind === 'BIRTHDAY'" data-testid="message-birthday" @click="toggleBirthday">
                <AppIcon name="party" :size="18" />
                {{ t('messages.compose.birthdayToggle') }}
            </AppChip>
            <MessageSendResults v-if="phase === 'results'" :results="results" @again="again" />
            <MessageSent v-else-if="phase === 'sent' && selected" :title="t('messages.compose.sentTitle', { name: selected.member.name })" :text="sentText" @again="again" />
            <section v-else-if="phase === 'queued'" class="composer__queued" role="status">
                <AppIcon name="cloud-off" :size="40" />
                <h2 class="composer__queued-title">{{ t('messages.compose.queuedTitle') }}</h2>
                <p>{{ t('messages.compose.queuedBody') }}</p>
                <AppButton icon="plus" @click="again">{{ t('messages.compose.another') }}</AppButton>
            </section>
            <MessageFullAlert
                v-else-if="selected && selected.quota.isFull"
                :name="selected.member.name"
                :limit="selected.quota.limit"
                :is-busy="isRetracting"
                :error-message="retractError"
                @retract="retract"
            />
            <MessageRecorder
                v-else
                :is-recording="isRecording"
                :is-done="phase === 'done'"
                :is-busy="isBusy"
                :is-previewing="preview.isPlaying.value"
                :elapsed-ms="shownMs"
                :hint="hint"
                :error-message="errorMessage"
                @toggle="toggle"
                @preview="preview.play"
                @send="send"
            />
        </template>
    </div>
</template>

<script setup lang="ts">
import ChildFoliage from '~~/technical/Motion/app/components/ChildFoliage.vue'
const props = defineProps<{ initialRecipientId: string | null; initialKind: MessageKind }>()

const { t, formatNumber } = useI18n()
const { children, grownUps, ensureLoaded } = useMembers()
const { currentId, isChild, isParent } = useCurrentMember()
const { load, startPolling, stopPolling } = useMessages()
const { quotaFor, retractOldest } = useMessageQuota()
const { sendNow, cancel } = useOutbox()
const { sendToEach } = useGroupSend()
const { isRecording, elapsedMs, errorMessage, start, stop } = useRecorder()
const { play: playCue } = useSoundCues()
const preview = useRecordingPreview()

const phase = ref<'idle' | 'done' | 'sent' | 'queued' | 'results'>('idle')
const results = ref<ISendResult[]>([])
const isLoaded = ref(false)
const isBusy = ref(false)
const isRetracting = ref(false)
const retractError = ref('')
const selectedId = ref<string | null>(props.initialRecipientId)
const kind = ref<MessageKind>(props.initialKind)
const recording = ref<IRecording | null>(null)

const people = computed(() => (isChild.value ? grownUps.value.filter(member => member.id !== currentId.value) : children.value))
const recipients = computed<IMessageRecipient[]>(() => people.value.map(member => ({ member, quota: quotaFor(member.id) })))
const canAll = computed(() => !isChild.value && people.value.length >= 2)
const isAll = computed(() => canAll.value && selectedId.value === ALL_RECIPIENTS_ID)
const selected = computed(() => recipients.value.find(item => item.member.id === selectedId.value) ?? null)
const isValidId = (id: string | null): boolean => (canAll.value && id === ALL_RECIPIENTS_ID) || people.value.some(member => member.id === id)
const firstId = (): string | null => people.value[0]?.id ?? null
const backPath = computed(() => (isChild.value ? '/kid' : isParent.value ? '/home' : '/relative'))
const shownMs = computed(() => (phase.value === 'done' ? (recording.value?.ms ?? 0) : elapsedMs.value))
const canWish = computed(() => {
    const days = selected.value?.member.birthdayInDays ?? null
    return !isChild.value && !isAll.value && (kind.value === 'BIRTHDAY' || (days !== null && days <= BIRTHDAY_WISH_WINDOW_DAYS))
})
const hint = computed(() =>
    isAll.value
        ? t('homeCards.hintAll')
        : selected.value
        ? t(isChild.value ? 'messages.compose.hintChild' : 'messages.compose.hintAdult', {
              name: selected.value.member.name,
              count: formatNumber(selected.value.quota.count),
              limit: formatNumber(selected.value.quota.limit),
          })
        : '',
)
const sentText = computed(() =>
    selected.value ? t('messages.compose.sentLeft', { count: selected.value.quota.remaining, name: selected.value.member.name }) : '',
)

const reset = (): void => {
    recording.value = null
    preview.clear()
    phase.value = 'idle'
    errorMessage.value = ''
    retractError.value = ''
}

const onSelect = async (id: string): Promise<void> => {
    if (isRecording.value) {
        await stop()
    }
    selectedId.value = id
    reset()
}

const toggleBirthday = (): void => {
    kind.value = kind.value === 'BIRTHDAY' ? 'NORMAL' : 'BIRTHDAY'
}

const toggle = async (): Promise<void> => {
    if (isBusy.value) {
        return
    }
    if (!isRecording.value) {
        reset()
        await start()
        return
    }
    const result = await stop()
    if (!result) {
        errorMessage.value = t('messages.compose.tooShort')
        return
    }
    recording.value = result
    preview.load(result.blob)
    phase.value = 'done'
}

const retract = async (): Promise<void> => {
    if (!selected.value) {
        return
    }
    isRetracting.value = true
    retractError.value = ''
    try {
        await retractOldest(selected.value.member.id)
    } catch (error) {
        console.error('Le message le plus ancien n a pas pu être retiré', error)
        retractError.value = t('messages.full.failed')
        playCue('error')
    } finally {
        isRetracting.value = false
    }
}

const sendAll = async (): Promise<void> => {
    if (!recording.value) {
        return
    }
    isBusy.value = true
    errorMessage.value = ''
    try {
        results.value = await sendToEach(people.value, recording.value)
        await load()
        playCue(results.value.some(result => result.status !== 'sent' && result.status !== 'queued') ? 'error' : 'success')
        preview.clear()
        phase.value = 'results'
    } finally {
        isBusy.value = false
    }
}

const send = async (): Promise<void> => {
    if (isBusy.value) {
        return
    }
    if (isAll.value) {
        await sendAll()
        return
    }
    const target = selected.value
    if (!recording.value || !currentId.value || !target) {
        return
    }
    isBusy.value = true
    errorMessage.value = ''
    try {
        const item = await sendNow({
            kind: 'message',
            label: t('outbox.messageLabel', { name: target.member.name }),
            blob: recording.value.blob,
            mime: recording.value.mime,
            durationMs: recording.value.ms,
            payload: { fromMemberId: currentId.value, toMemberId: target.member.id, kind: kind.value },
        })
        if (item.status === 'failed') {
            await cancel(item.id)
            await load()
            errorMessage.value =
                item.errorStatus === 409
                    ? t('messages.compose.limitReached', { name: target.member.name, limit: formatNumber(target.quota.limit) })
                    : errorTextFromMessage(item.errorMessage, 'messages.compose.sendFailed')
            playCue('error')
            return
        }
        preview.clear()
        if (item.status === 'sent') {
            await load()
        }
        phase.value = item.status === 'sent' ? 'sent' : 'queued'
    } catch (error) {
        console.error('Le message n a pas pu être envoyé', error)
        errorMessage.value = errorText(error, 'messages.compose.sendFailed')
    } finally {
        isBusy.value = false
    }
}

const again = (): void => {
    kind.value = 'NORMAL'
    reset()
}

watch(people, () => {
    if (people.value.length > 0 && !isValidId(selectedId.value)) {
        selectedId.value = firstId()
    }
})

onMounted(async () => {
    await Promise.all([ensureLoaded(), load()])
    if (people.value.length > 0 && !isValidId(selectedId.value)) {
        selectedId.value = firstId()
    }
    isLoaded.value = true
    startPolling()
})

onBeforeUnmount(() => {
    stopPolling()
    if (isRecording.value) {
        void stop()
    }
})

watch(
    () => elapsedMs.value,
    async ms => {
        if (isRecording.value && ms >= MESSAGE_MAX_DURATION_MS) {
            await toggle()
        }
    },
)

</script>

<style scoped>
.composer.composer--adult {
    max-width: 800px;
    margin-inline: auto;
    gap: 24px;
}

.composer--adult :deep(.rec) {
    width: 100%;
    max-width: 640px;
    margin-inline: auto;
    border-radius: 24px;
    padding: 28px 24px;
}

.composer--adult :deep(.rec .btn) {
    border-radius: 24px;
    min-height: 56px;
}

@media (min-width: 720px) {
    .composer--adult :deep(.recipients) {
        flex-wrap: wrap;
        justify-content: center;
        gap: 16px;
        padding: 8px 4px 16px;
    }

    .composer--adult :deep(.recipient) {
        width: 128px;
        padding: 16px 12px;
        gap: 8px;
    }
}

.composer {
    width: 100%;
    min-width: 0;
    max-width: 100%;
    display: flex;
    flex-direction: column;
    gap: 18px;
    padding: 4px 0 24px;
}

.composer__head {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 12px;
}

.composer__title {
    min-width: 0;
    flex: 1;
    overflow-wrap: anywhere;
    font-size: min(1.875rem, 9vw);
}

.composer__wish {
    align-self: flex-start;
    display: inline-flex;
    align-items: center;
    gap: 8px;
}

.composer__queued {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 20px 0;
    text-align: center;
}

.composer__queued-title {
    margin: 0;
    font: 700 1.5rem/1.2 var(--font-title);
}

.composer__queued p {
    margin: 0;
    color: var(--ink-soft);
}
</style>
