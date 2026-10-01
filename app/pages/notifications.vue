<template>
    <div class="stack narrow">
        <h1 class="title">{{ t('notifications.title') }}</h1>
        <button v-if="unreadCount > 0" type="button" class="btn btn--white btn--small" @click="markRead()">{{ t('notifications.markAllRead') }}</button>
        <p v-if="items.length === 0" class="muted">{{ t('notifications.empty') }}</p>
        <ul class="stack list">
            <li v-for="item in items" :key="item.id" class="card row" :class="{ 'card--unread': !item.isRead }">
                <p class="grow">{{ describeNotification(item, t) }}</p>
                <span v-if="!item.isRead" class="badge">{{ t('notifications.new') }}</span>
                <button v-if="!item.isRead" type="button" class="btn btn--white btn--small" @click="markRead([item.id])">{{ t('notifications.read') }}</button>
            </li>
        </ul>
        <NuxtLink to="/sharing" class="btn btn--block">{{ t('notifications.sharing') }}</NuxtLink>
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
