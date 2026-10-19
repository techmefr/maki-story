<template>
    <header class="page-intro">
        <span class="page-intro__icon" :style="{ background: `var(--${tone})` }" aria-hidden="true"><AppIcon :name="icon" :size="32" /></span>
        <div class="page-intro__text">
            <h1 class="title">{{ title }}</h1>
            <p v-if="hint" class="page-intro__hint">{{ hint }}</p>
        </div>
    </header>
</template>

<script setup lang="ts">
defineProps<{ title: string; hint?: string; icon: IconName; tone: 'sky' | 'mint-soft' | 'violet' | 'pink' | 'yellow' | 'danger-soft' }>()
</script>

<style scoped>
.page-intro {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    margin-block: 8px;
}

.page-intro__icon {
    display: grid;
    place-items: center;
    flex: none;
    width: 64px;
    height: 64px;
    border: var(--outline) solid var(--ink);
    border-radius: 24px;
    color: var(--on-accent);
    box-shadow: var(--shadow);
}

.page-intro__text {
    display: grid;
    gap: 12px;
    min-width: 0;
    overflow-wrap: anywhere;
}

.page-intro__hint {
    margin: 0;
    color: var(--ink-soft);
    font-size: 1rem;
    line-height: 1.5;
}
</style>
