<template>
    <div class="stack narrow">
        <h1 class="title">Notifications</h1>
        <button v-if="unreadCount > 0" type="button" class="btn btn--white btn--small" @click="markRead()">Tout marquer comme lu</button>
        <p v-if="items.length === 0" class="muted">Aucune notification pour l’instant.</p>
        <ul class="stack list">
            <li v-for="item in items" :key="item.id" class="card row" :class="{ 'card--unread': !item.isRead }">
                <p class="grow">{{ describeNotification(item) }}</p>
                <span v-if="!item.isRead" class="badge">Nouveau</span>
                <button v-if="!item.isRead" type="button" class="btn btn--white btn--small" @click="markRead([item.id])">Lu</button>
            </li>
        </ul>
        <NuxtLink to="/sharing" class="btn btn--block">Partage entre familles</NuxtLink>
    </div>
</template>

<script setup lang="ts">
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
