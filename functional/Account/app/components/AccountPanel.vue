<template>
    <div class="stack account" data-testid="account">
        <BackLink @click="emit('back')" />
        <h1 class="account__title">{{ t('account.title') }}</h1>
        <p v-if="loadFailed" class="error" role="alert">{{ t('account.loadFailed') }}</p>
        <div v-else-if="member" class="account__identity" data-testid="account-identity">
            <AppAvatar :member="member" :size="56" />
            <div class="account__who">
                <div class="account__name">{{ member.name }}</div>
                <div class="account__meta">{{ t('account.identity', { email: info?.email ?? '', role: roleText }) }}</div>
            </div>
        </div>
        <template v-if="canManage">
            <section class="account__card account__card--export" aria-labelledby="account-export-title">
                <h2 id="account-export-title" class="account__heading">{{ t('account.export.title') }}</h2>
                <p class="account__text">{{ t('account.export.text', { days: EXPORT_LINK_DAYS }) }}</p>
                <AppButton
                    is-block
                    :variant="exportState === 'sent' ? 'secondary' : 'primary'"
                    tone="mint"
                    :icon="exportState === 'sent' ? 'check' : 'download'"
                    :loading="exportState === 'sending'"
                    :disabled="exportState === 'sent'"
                    data-testid="account-export"
                    @click="requestExport"
                >
                    {{ exportLabel }}
                </AppButton>
                <p v-if="exportState === 'failed'" class="error" role="alert">{{ t('account.export.failed') }}</p>
            </section>
            <section class="account__card account__card--danger" aria-labelledby="account-delete-title">
                <h2 id="account-delete-title" class="account__heading">{{ t('account.delete.title') }}</h2>
                <p class="account__text account__text--ink">{{ t('account.delete.text') }}</p>
                <AppButton is-block variant="destructive" icon="trash" data-testid="account-delete-start" @click="openSheet">
                    {{ t('account.delete.start') }}
                </AppButton>
            </section>
        </template>
        <p v-else-if="member" class="account__text" data-testid="account-parent-only">{{ t('account.parentOnly') }}</p>
        <AppButton variant="secondary" is-block icon="eye" to="/legal">{{ t('account.terms.link') }}</AppButton>
        <AppBottomSheet :open="isSheetOpen" :title="t('account.delete.sheetTitle')" @close="closeSheet">
            <p class="account__text">{{ t('account.delete.sheetText', { word: t('account.delete.word') }) }}</p>
            <AppInput
                v-model="word"
                autocomplete="off"
                autocapitalize="characters"
                spellcheck="false"
                :placeholder="t('account.delete.word')"
                :aria-label="t('account.delete.wordLabel')"
                data-testid="account-delete-word"
            />
            <p class="account__label">{{ t('account.delete.codeLabel') }}</p>
            <PinPad :key="attempt" :is-disabled="isBusy || !isWordRight" @submit="removeAccount" />
            <p v-if="deleteError" class="error" role="alert">{{ deleteError }}</p>
            <AppButton variant="secondary" is-block icon="close" @click="closeSheet">{{ t('account.delete.cancel') }}</AppButton>
        </AppBottomSheet>
    </div>
</template>

<script setup lang="ts">
type TExportState = 'idle' | 'sending' | 'sent' | 'failed'

const emit = defineEmits<{ back: []; deleted: [] }>()

const { t } = useI18n()
const { current: member, isParent } = useCurrentMember()
const { info, load, requestExport: sendExport, removeFamily } = useAccount()

const loadFailed = ref(false)
const exportState = ref<TExportState>('idle')
const isSheetOpen = ref(false)
const isBusy = ref(false)
const word = ref('')
const attempt = ref(0)
const deleteError = ref('')

const canManage = computed(() => isParent.value && info.value?.canManageFamily === true)
const roleText = computed(() => (member.value ? roleLabel(member.value.role) : ''))
const isWordRight = computed(() => DELETE_WORDS.includes(word.value.trim().toUpperCase()))
const exportLabel = computed(() => {
    if (exportState.value === 'sending') {
        return t('account.export.sending')
    }
    return exportState.value === 'sent' ? t('account.export.sent') : t('account.export.request')
})

const requestExport = async (): Promise<void> => {
    exportState.value = 'sending'
    try {
        const result = await sendExport()
        exportState.value = result.isEmailSent ? 'sent' : 'failed'
    } catch (_error) {
        exportState.value = 'failed'
    }
}

const openSheet = (): void => {
    word.value = ''
    deleteError.value = ''
    attempt.value += 1
    isSheetOpen.value = true
}

const closeSheet = (): void => {
    isSheetOpen.value = false
}

const removeAccount = async (code: string): Promise<void> => {
    isBusy.value = true
    deleteError.value = ''
    try {
        await removeFamily(code, word.value.trim())
        emit('deleted')
    } catch (error) {
        deleteError.value = (error as { statusCode?: number }).statusCode === 403 ? t('account.delete.wrongCode') : t('account.delete.failed')
        attempt.value += 1
    } finally {
        isBusy.value = false
    }
}

onMounted(async () => {
    loadFailed.value = (await load()) === null
})
</script>

<style scoped>
.account {
    gap: 18px;
}

.account__head {
    gap: 12px;
}

.account__title {
    margin: 0;
    font: 700 min(2rem, 10vw) / 1.1 var(--font-title);
}

.account__identity {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 16px;
    border: 3px solid var(--ink);
    border-radius: 24px;
    background: var(--paper);
}

.account__who {
    min-width: 0;
}

.account__name {
    font: 700 1.25rem / 1.2 var(--font-title);
    overflow-wrap: anywhere;
}

.account__meta {
    color: var(--ink-soft);
    font: 500 0.9375rem / 1.3 var(--font-body);
    overflow-wrap: anywhere;
}

.account__card {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    border: 3px solid var(--ink);
    border-radius: 26px;
}

.account__card--export {
    background: var(--paper);
    box-shadow: var(--shadow-lg);
}

.account__card--danger {
    background: var(--danger-soft);
    color: var(--on-accent);
    --ink: var(--on-accent);
    --line: var(--on-accent);
    --ink-soft: var(--on-accent);
}

.account__heading {
    margin: 0;
    font: 700 1.3125rem / 1.2 var(--font-title);
}

.account__text {
    margin: 0;
    color: var(--ink-soft);
    font: 500 1rem / 1.4 var(--font-body);
}

.account__text--ink {
    color: var(--ink);
}

.account__label {
    margin: 0;
    font: 700 0.9375rem / 1.2 var(--font-title);
}
</style>
