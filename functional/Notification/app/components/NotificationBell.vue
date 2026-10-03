<template>
    <NuxtLink v-if="isVisible" to="/notifications" class="bell" :class="{ 'bell--idle': unreadCount === 0 }" :aria-label="label" data-testid="bell">
        <AppIcon name="bell" :size="26" :motion="unreadCount > 0 ? 'wiggle' : 'none'" />
        <span v-if="unreadCount > 0" class="bell__count" aria-hidden="true">{{ unreadCount > 9 ? `${formatNumber(9)}+` : formatNumber(unreadCount) }}</span>
    </NuxtLink>
</template>

<script setup lang="ts">
const { t, formatNumber } = useI18n()
const route = useRoute()
const { current } = useCurrentMember()
const { unreadCount, load } = useNotifications()

const isVisible = computed(() => current.value !== null && current.value.role !== 'child')
const label = computed(() => (unreadCount.value > 0 ? t('notifications.bellUnread', { count: unreadCount.value }) : t('notifications.bellNone')))

const refresh = async (): Promise<void> => {
    if (isVisible.value) {
        await load()
    }
}

onMounted(refresh)
watch(() => [route.path, current.value?.id], refresh)
</script>

<style scoped>
.bell {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--tap);
    height: var(--tap);
    border: 2.5px solid var(--ink);
    border-radius: 50%;
    background: var(--yellow);
    color: var(--on-accent);
    box-shadow: var(--shadow);
}

.bell--idle {
    background: var(--grey-ui);
    color: var(--grey-ui-ink);
}

.bell__count {
    position: absolute;
    top: -8px;
    inset-inline-end: -8px;
    min-width: 22px;
    height: 22px;
    padding: 0 5px;
    border: 2px solid var(--ink);
    border-radius: 999px;
    background: var(--coral);
    color: var(--on-accent);
    font: 700 12px/18px var(--font-title);
    text-align: center;
}
</style>
