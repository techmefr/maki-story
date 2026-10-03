<template>
    <button v-bind="$attrs" type="button" class="iconbtn" :class="`iconbtn--${tone}`" :aria-label="label" :disabled="disabled">
        <AppIcon :name="icon" :size="size === 'lg' ? 28 : 22" />
    </button>
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false })

withDefaults(
    defineProps<{
        icon: IconName
        label: string
        tone?: 'sky' | 'yellow' | 'mint' | 'coral' | 'paper'
        size?: 'md' | 'lg'
        disabled?: boolean
    }>(),
    { tone: 'sky', size: 'md' }
)
</script>

<style scoped>
.iconbtn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border: var(--outline) solid var(--ink);
    border-radius: 50%;
    color: var(--on-accent);
    box-shadow: var(--shadow);
    cursor: pointer;
    transition:
        transform 0.15s ease-out,
        box-shadow 0.15s ease-out;
}

.iconbtn:active:not(:disabled) {
    transform: translate(3px, 4px);
    box-shadow: var(--shadow-press);
}

.iconbtn:disabled {
    background: var(--grey);
    border-color: var(--grey-line);
    box-shadow: none;
    color: var(--ink-soft);
}

.iconbtn--sky {
    background: var(--sky);
}

.iconbtn--yellow {
    background: var(--yellow);
}

.iconbtn--mint {
    background: var(--mint);
}

.iconbtn--coral {
    background: var(--coral);
}

.iconbtn--paper {
    background: var(--paper);
    color: var(--ink);
}

@media (prefers-reduced-motion: reduce) {
    .iconbtn {
        transition: none;
    }
}
</style>
