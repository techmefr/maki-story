<template>
    <p v-if="aiStatus" class="muted" data-testid="ai-quota">{{ label }}</p>
</template>

<script setup lang="ts">
const { aiStatus, refreshStatus } = useAi()

const label = computed(() => {
    const value = aiStatus.value
    if (!value) {
        return ''
    }
    if (!value.enabled) {
        return AI_UNAVAILABLE_MESSAGE
    }
    if (value.remainingUsd <= 0) {
        return AI_QUOTA_MESSAGE
    }
    return `Budget IA du mois : il reste ${formatUsd(value.remainingUsd)} sur ${formatUsd(value.monthlyBudgetUsd)}.`
})

onMounted(refreshStatus)
</script>
