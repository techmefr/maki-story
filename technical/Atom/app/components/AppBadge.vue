<template>
    <span class="badge" :class="tone ? `badge--${tone}` : undefined"><slot /></span>
</template>

<script setup lang="ts">
defineProps<{ tone?: 'success' | 'warning' | 'danger' | 'info' }>()
</script>

<style scoped>
.badge--success {
    background: var(--mint-soft);
    color: var(--on-accent);
}

.badge--warning {
    background: var(--yellow);
    color: var(--on-accent);
}

.badge--danger {
    background: var(--danger-soft);
    color: var(--on-accent);
}

.badge--info {
    background: var(--sky);
    color: var(--on-accent);
}
</style>
