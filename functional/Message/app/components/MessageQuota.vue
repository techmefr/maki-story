<template>
    <AppBadge class="quota" :class="{ 'quota--full': quota.isFull }" :aria-label="t('messages.quota.label', { count: quota.count, limit: quota.limit })" data-testid="message-quota">
        <span aria-hidden="true">{{ t('messages.quota.short', { count: formatNumber(quota.count), limit: formatNumber(quota.limit) }) }}</span>
    </AppBadge>
</template>

<script setup lang="ts">
defineProps<{ quota: IQuota }>()

const { t, formatNumber } = useI18n()
</script>

<style scoped>
.quota {
    padding: 2px 10px;
    border-width: 2px;
    background: var(--yellow);
    color: var(--on-accent);
    font-size: 0.8125rem;
}

.quota--full {
    background: var(--coral);
}
</style>
