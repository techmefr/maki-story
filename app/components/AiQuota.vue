<template>
    <p v-if="aiStatus" class="muted" data-testid="ai-quota">{{ label }}</p>
</template>

<script setup lang="ts">
const { t, formatNumber } = useI18n()
const { aiStatus, refreshStatus } = useAi()

const formatUsd = (amount: number): string => formatNumber(amount, { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 })

const label = computed(() => {
    const value = aiStatus.value
    if (!value) {
        return ''
    }
    if (!value.enabled) {
        return t(AI_UNAVAILABLE_KEY)
    }
    if (value.remainingUsd <= 0) {
        return t(AI_QUOTA_KEY)
    }
    return t('ai.quota.label', { remaining: formatUsd(value.remainingUsd), budget: formatUsd(value.monthlyBudgetUsd) })
})

onMounted(refreshStatus)
</script>
