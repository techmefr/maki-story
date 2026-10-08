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

const retry = async () => {
    isChecking.value = true
    await check()
    isChecking.value = false
}
</script>

<style scoped>
.offline-banner {
    position: fixed;
    inset-inline: 0;
    bottom: 0;
    z-index: 60;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px 16px calc(env(safe-area-inset-bottom) + 10px);
    background: var(--yellow);
    color: var(--on-accent);
    border-top: 2.5px solid var(--ink);
    font: 700 0.875rem/1.3 var(--font-title);
}

.offline-banner__retry {
    padding: 4px 12px;
    border: 2px solid var(--ink);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
}
</style>
