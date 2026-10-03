<template>
    <section class="msec">
        <h3 class="msec__title">
            <button type="button" class="msec__head" :aria-expanded="isOpen ? 'true' : 'false'" :aria-controls="panelId" @click="emit('toggle')">
                <span class="msec__label">{{ label }}</span>
                <span v-if="value" class="msec__value">{{ value }}</span>
                <AppIcon name="chevron-down" :size="20" class="msec__chevron" :class="{ 'msec__chevron--open': isOpen }" />
            </button>
        </h3>
        <div v-show="isOpen" :id="panelId" class="msec__panel">
            <slot />
        </div>
    </section>
</template>

<script setup lang="ts">
defineProps<{ label: string; value?: string; isOpen: boolean }>()
const emit = defineEmits<{ toggle: [] }>()

const panelId = useId()
</script>

<style scoped>
.msec {
    overflow: hidden;
    border: var(--outline) solid var(--ink);
    border-radius: 22px;
    background: var(--paper);
}

.msec__title {
    margin: 0;
}

.msec__head {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    min-height: 56px;
    padding: 14px 16px;
    border: 0;
    background: transparent;
    color: var(--ink);
    text-align: start;
    cursor: pointer;
}

.msec__label {
    flex: 1;
    min-width: 0;
    font: 700 1.125rem/1.2 var(--font-title);
}

.msec__value {
    color: var(--ink-soft);
    font: 500 1rem/1.2 var(--font-body);
    text-align: end;
}

.msec__chevron {
    flex-shrink: 0;
    transition: transform 0.15s ease-out;
}

.msec__chevron--open {
    transform: rotate(180deg);
}

.msec__panel {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 0 16px 16px;
}

@media (prefers-reduced-motion: reduce) {
    .msec__chevron {
        transition: none;
    }
}
</style>
