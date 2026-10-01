<template>
    <NuxtLink v-if="isVisible" to="/notifications" class="bell" :aria-label="label">
        <AppIcon name="sparkles" :size="26" />
        <span v-if="unreadCount > 0" class="bell__count" aria-hidden="true">{{ unreadCount > 9 ? '9+' : unreadCount }}</span>
    </NuxtLink>
</template>

<script setup lang="ts">
const route = useRoute()
const { current } = useCurrentMember()
const { unreadCount, load } = useNotifications()

const isVisible = computed(() => current.value !== null && current.value.role !== 'child')
const label = computed(() => (unreadCount.value > 0 ? `Notifications, ${unreadCount.value} non lue${unreadCount.value > 1 ? 's' : ''}` : 'Notifications'))

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
    width: 44px;
    height: 44px;
    border: 2.5px solid var(--ink);
    border-radius: 50%;
    background: var(--paper);
    color: var(--ink);
    box-shadow: 3px 3px 0 var(--ink);
}

.bell__count {
    position: absolute;
    top: -8px;
    right: -8px;
    min-width: 22px;
    height: 22px;
    padding: 0 5px;
    border: 2px solid var(--ink);
    border-radius: 999px;
    background: var(--coral);
    font: 700 12px/18px var(--font-title);
    text-align: center;
}
</style>
