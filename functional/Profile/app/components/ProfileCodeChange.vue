<template>
    <AppBottomSheet :open="open" :title="t('profile.edit.codeTitle')" @close="close">
        <div class="cc stack" data-testid="code-change">
            <template v-if="stage === 'done'">
                <p class="cc__text" role="status">{{ t('profile.edit.codeDone') }}</p>
                <AppButton icon="check" is-block @click="close">{{ t('common.done') }}</AppButton>
            </template>
            <template v-else>
                <p class="cc__text">{{ hint }}</p>
                <PinPad :key="padKey" :is-disabled="isBusy" :min-length="PIN_MIN_LENGTH" @submit="onCode" />
                <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
                <AppButton variant="secondary" size="sm" icon="close" @click="close">{{ t('common.cancel') }}</AppButton>
            </template>
        </div>
    </AppBottomSheet>
</template>

<script setup lang="ts">
type TStage = 'current' | 'new' | 'confirm' | 'done'

const { open, member } = defineProps<{ open: boolean; member: IMember }>()
const emit = defineEmits<{ close: [] }>()

const { t } = useI18n()
const { setCode } = useMembers()

const stage = ref<TStage>(member.hasCode ? 'current' : 'new')
const currentCode = ref('')
const firstEntry = ref('')
const padKey = ref(0)
const isBusy = ref(false)
const errorMessage = ref('')

const HINTS: Record<Exclude<TStage, 'done'>, string> = {
    current: 'profile.edit.codeCurrent',
    new: 'profile.edit.codeNew',
    confirm: 'profile.edit.codeConfirm',
}

const hint = computed(() => (stage.value === 'done' ? '' : t(HINTS[stage.value])))

const restart = (): void => {
    stage.value = member.hasCode ? 'current' : 'new'
    currentCode.value = ''
    firstEntry.value = ''
    errorMessage.value = ''
    padKey.value += 1
}

watch(
    () => open,
    isOpen => {
        if (isOpen) {
            restart()
        }
    },
)

const close = (): void => emit('close')

const save = async (value: string): Promise<void> => {
    isBusy.value = true
    try {
        await setCode(member.id, { kind: 'pin', value, currentCode: member.hasCode ? currentCode.value : undefined })
        stage.value = 'done'
    } catch (error) {
        const status = (error as { statusCode?: number }).statusCode
        restart()
        errorMessage.value = status === 403 || status === 429 ? t('profile.edit.codeBlocked') : t('profile.edit.codeFailed')
    } finally {
        isBusy.value = false
    }
}

const onCode = async (value: string): Promise<void> => {
    errorMessage.value = ''
    if (stage.value === 'current') {
        currentCode.value = value
        stage.value = 'new'
        padKey.value += 1
        return
    }
    if (stage.value === 'new') {
        firstEntry.value = value
        stage.value = 'confirm'
        padKey.value += 1
        return
    }
    if (firstEntry.value !== value) {
        restart()
        errorMessage.value = t('profile.unlock.mismatch')
        return
    }
    await save(value)
}
</script>

<style scoped>
.cc {
    align-items: center;
    text-align: center;
}

.cc__text {
    margin: 0;
    color: var(--ink-soft);
    font: 500 1.0625rem/1.3 var(--font-body);
}
</style>
