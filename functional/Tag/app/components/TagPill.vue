<template>
    <span class="pill">
        <TagBubble :icon="tag.icon" :color="tag.color" :size="28" />
        <span>{{ label }}</span>
        <span v-if="isAuto" class="pill__auto">{{ t('tags.auto') }}</span>
    </span>
</template>

<script setup lang="ts">
const { tag, isAuto = false } = defineProps<{ tag: ITag; isAuto?: boolean }>()

const { t } = useI18n()
const { labelOf } = useTagLabel()

const label = computed(() => labelOf(tag))
</script>

<style scoped>
.pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 36px;
    padding: 3px 14px 3px 4px;
    border: var(--outline) solid var(--ink);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: 700 0.9375rem/1.1 var(--font-title);
}

.pill :deep(.bubble) {
    border-width: 2px;
}

.pill__auto {
    padding: 0 6px;
    border: 2px solid var(--ink);
    border-radius: 999px;
    background: var(--paper);
    font-size: 0.75rem;
}
</style>
