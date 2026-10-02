<template>
    <section v-if="aiStatus && aiStatus.enabled" class="card stack" aria-labelledby="ai-budget-title" data-testid="ai-budget">
        <h2 id="ai-budget-title" class="subtitle">{{ t('aiSafety.budget.title') }}</h2>
        <p class="muted">{{ aiStatus.isCustomBudget ? t('aiSafety.budget.custom') : t('aiSafety.budget.default', { amount: formatUsd(aiStatus.defaultBudgetUsd) }) }}</p>
        <label class="stack" style="gap: 6px">
            <span class="label">{{ t('aiSafety.budget.label') }}</span>
            <input v-model.number="amount" class="input" type="number" min="0" max="1000" step="0.5" inputmode="decimal" data-testid="ai-budget-input" />
        </label>
        <div class="row row--wrap">
            <AppButton size="sm" :disabled="isBusy || !isAmountValid" @click="save(amount)">
                <AppIcon name="check" :size="18" />{{ t('aiSafety.budget.save') }}
            </AppButton>
            <AppButton variant="secondary" size="sm" v-if="aiStatus.isCustomBudget" :disabled="isBusy" @click="save(null)">
                <AppIcon name="redo" :size="18" />{{ t('aiSafety.budget.reset') }}
            </AppButton>
        </div>
        <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
    </section>
</template>

<script setup lang="ts">
const { t, formatNumber } = useI18n()
const { request } = useApi()
const { aiStatus, refreshStatus } = useAi()

const amount = ref(0)
const isBusy = ref(false)
const errorMessage = ref('')

const formatUsd = (value: number): string => formatNumber(value, { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 })
const isAmountValid = computed(() => Number.isFinite(amount.value) && amount.value >= 0 && amount.value <= 1000)

const save = async (monthlyBudgetUsd: number | null): Promise<void> => {
    isBusy.value = true
    errorMessage.value = ''
    try {
        await request('/ai/budget', { method: 'PUT', body: { monthlyBudgetUsd } })
        await refreshStatus()
        amount.value = aiStatus.value?.monthlyBudgetUsd ?? 0
    } catch (_error) {
        errorMessage.value = t('aiSafety.budget.error')
    } finally {
        isBusy.value = false
    }
}

watch(
    () => aiStatus.value?.monthlyBudgetUsd,
    value => {
        if (value !== undefined) {
            amount.value = value
        }
    },
    { immediate: true },
)

onMounted(refreshStatus)
</script>
