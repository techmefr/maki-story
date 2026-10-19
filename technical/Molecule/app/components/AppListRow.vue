<template>
    <component :is="to ? NuxtLink : 'div'" :to="to" class="listrow">
        <slot name="lead" />
        <span class="listrow__text">
            <span class="listrow__title">{{ title }}</span>
            <span v-if="subtitle" class="listrow__subtitle">{{ subtitle }}</span>
        </span>
        <slot name="action" />
    </component>
</template>

<script setup lang="ts">
import { NuxtLink } from '#components'

defineProps<{ title: string; subtitle?: string; to?: string }>()
</script>

<style scoped>
.listrow {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: var(--tap);
    padding: 12px 14px;
    border: var(--outline) solid var(--ink);
    border-radius: 22px;
    background: var(--paper);
    color: var(--ink);
    box-shadow: var(--shadow);
    text-decoration: none;
}

.listrow__text {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
}

.listrow__title {
    font: 700 1.0625rem/1.2 var(--font-title);
    overflow-wrap: anywhere;
}

.listrow__subtitle {
    color: var(--ink-soft);
    font: 600 0.875rem/1.4 var(--font-body);
    overflow-wrap: anywhere;
}
</style>
