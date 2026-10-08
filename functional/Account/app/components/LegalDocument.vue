<template>
    <div class="stack legal" data-testid="legal">
        <BackLink @click="emit('back')" />
        <h1 class="legal__title">{{ t('legal.title') }}</h1>
        <p class="legal__draft" role="note">{{ t('legal.draft') }}</p>
        <AppTabs v-model="tab" :items="tabs" :label="t('legal.tabsLabel')" class="legal__tabs" />
        <article v-for="id in sectionIds" :key="`${tab}-${id}`" class="legal__section">
            <h2 class="legal__heading">{{ t(`legal.${tab}.${id}.title`) }}</h2>
            <p class="legal__text">{{ t(`legal.${tab}.${id}.text`) }}</p>
        </article>
        <p v-if="acceptedOn" class="muted" role="status">{{ t('legal.acceptedOn', { date: acceptedOn }) }}</p>
        <div v-if="canAccept" class="legal__bar">
            <div class="legal__bar-inner stack">
                <AppCheckbox v-model="hasReadTerms" class="legal__check" data-testid="legal-terms">{{ t('legal.checkTerms') }}</AppCheckbox>
                <AppCheckbox v-model="isGuardian" class="legal__check" data-testid="legal-guardian">{{ t('legal.checkGuardian') }}</AppCheckbox>
                <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
                <AppButton is-block icon="check" :disabled="!isReady || isBusy" data-testid="legal-accept" @click="emit('accept')">
                    {{ t('legal.accept') }}
                </AppButton>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
type TTab = 'cgu' | 'priv' | 'cgv'

const SECTION_COUNTS: Record<TTab, number> = { cgu: 6, priv: 6, cgv: 5 }

defineProps<{ canAccept: boolean; isBusy?: boolean; errorMessage?: string; acceptedOn?: string }>()
const emit = defineEmits<{ accept: []; back: [] }>()

const { t } = useI18n()

const tab = ref<string>('cgu')
const hasReadTerms = ref(false)
const isGuardian = ref(false)

const tabs = computed(() => (Object.keys(SECTION_COUNTS) as TTab[]).map(id => ({ id, label: t(`legal.tabs.${id}`) })))
const sectionIds = computed(() => Array.from({ length: SECTION_COUNTS[tab.value as TTab] ?? 0 }, (_, position) => String(position + 1)))
const isReady = computed(() => hasReadTerms.value && isGuardian.value)
</script>

<style scoped>
.legal {
    padding-bottom: 220px;
}

.legal__head {
    gap: 12px;
}

.legal__title {
    margin: 0;
    font: 700 min(1.875rem, 9vw) / 1.1 var(--font-title);
    overflow-wrap: anywhere;
}

.legal__draft {
    margin: 0;
    padding: 10px 14px;
    border: 3px solid var(--ink);
    border-radius: 18px;
    background: var(--danger-soft);
    color: var(--on-accent);
    font: 600 0.9375rem / 1.3 var(--font-body);
}

.legal__section {
    padding: 14px 16px;
    border: 3px solid var(--ink);
    border-radius: 22px;
    background: var(--paper);
}

.legal__heading {
    margin: 0 0 4px;
    font: 700 1.1875rem / 1.2 var(--font-title);
}

.legal__text {
    margin: 0;
    color: var(--ink-soft);
    font: 500 1rem / 1.4 var(--font-body);
}

.legal__bar {
    position: fixed;
    inset-inline: 0;
    bottom: 0;
    z-index: 5;
    display: flex;
    justify-content: center;
    border-top: 3px solid var(--ink);
    background: var(--bg);
}

.legal__bar-inner {
    width: 100%;
    max-width: 440px;
    padding: 12px 20px calc(env(safe-area-inset-bottom) + 16px);
    gap: 10px;
}

.legal__check {
    min-height: 44px;
    text-align: start;
    font: 600 0.9375rem / 1.25 var(--font-body);
}
</style>
