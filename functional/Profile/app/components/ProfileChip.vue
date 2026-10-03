<template>
    <AppChip class="pchip" :class="{ 'pchip--small': isSmall }" :selected="selected" :disabled="disabled">
        <slot />
    </AppChip>
</template>

<script setup lang="ts">
defineProps<{ selected?: boolean; disabled?: boolean; isSmall?: boolean }>()
</script>

<style scoped>
.pchip {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 44px;
    padding: 8px 16px;
    border: var(--outline) solid var(--ink);
    background: var(--bg);
    color: var(--ink);
    font: 700 1rem/1.1 var(--font-title);
}

.pchip.chip--on {
    background: var(--yellow);
    color: var(--on-accent);
}

.pchip:disabled {
    background: var(--grey);
    border-color: var(--grey-line);
    color: var(--ink-soft);
    cursor: not-allowed;
}

.pchip--small {
    padding: 6px 14px;
    font-size: 0.9375rem;
}
</style>
