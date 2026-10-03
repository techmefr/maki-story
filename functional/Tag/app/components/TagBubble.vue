<template>
    <span class="bubble" :style="{ width: `${size}px`, height: `${size}px`, background: hex }" aria-hidden="true">
        <TagIcon :icon="icon" :size="Math.round(size * 0.58)" />
    </span>
</template>

<script setup lang="ts">
const { color, size = 50 } = defineProps<{ icon: TagIconId; color: VoiceColorId; size?: number }>()

const hex = computed(() => getVoiceColor(color).hex)
</script>

<style scoped>
.bubble {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    border: var(--outline) solid var(--ink);
    border-radius: 50%;
    color: var(--on-accent);
}
</style>
