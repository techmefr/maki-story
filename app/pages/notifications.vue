<template>
    <div class="stack narrow">
        <h1 class="title">{{ t('notifications.title') }}</h1>
        <AppButton variant="secondary" size="sm" v-if="unreadCount > 0" @click="markRead()">{{ t('notifications.markAllRead') }}</AppButton>
        <AppEmpty v-if="items.length === 0" kind="notifications" :title="t('notifications.empty')" />
        <ul class="stack list">
            <li v-for="item in items" :key="item.id" class="card row" :class="{ 'card--unread': !item.isRead }">
                <p class="grow">{{ describeNotification(item, t) }}</p>
                <span v-if="!item.isRead" class="badge">{{ t('notifications.new') }}</span>
                <AppButton variant="secondary" size="sm" v-if="!item.isRead" @click="markRead([item.id])">{{ t('notifications.read') }}</AppButton>
            </li>
        </ul>
        <AppButton is-block to="/sharing">{{ t('notifications.sharing') }}</AppButton>
    </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const { items, unreadCount, load, markRead } = useNotifications()

onMounted(load)
</script>

<style scoped>
.list {
    list-style: none;
    padding: 0;
    margin: 0;
}

.card--unread {
    background: var(--sun);
}
</style>
