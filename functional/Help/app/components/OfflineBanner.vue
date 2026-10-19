<template>
    <div v-if="!isOnline" class="offline-banner" role="status">
        <AppIcon name="cloud-off" :size="18" />
        <span>{{ t('shell.offline.banner') }}</span>
        <button type="button" class="offline-banner__retry" :disabled="isChecking" @click="retry">{{ t('common.retry') }}</button>
    </div>
</template>

<script setup lang="ts">
const { isOnline, check } = useConnectivity()
const { t } = useI18n()
const isChecking = ref(false)

const retry = async (): Promise<void> => {
    if (isChecking.value) {
        return
    }
    isChecking.value = true
    try {
        await check()
    } finally {
        isChecking.value = false
    }
}
</script>

<style scoped>
.offline-banner {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 16px;
    background: var(--yellow);
    color: var(--on-accent);
    border-bottom: var(--outline) solid var(--ink);
    font: 700 0.875rem/1.3 var(--font-title);
}

.offline-banner__retry {
    min-height: var(--tap);
    padding: 8px 16px;
    border: 2px solid var(--ink);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
}
</style>
