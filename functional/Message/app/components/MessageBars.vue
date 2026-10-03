<template>
    <span class="bars" :class="{ 'bars--on': active }" :style="{ '--bars-height': `${height}px`, '--bars-color': color }" aria-hidden="true">
        <span v-for="bar in bars" :key="bar.index" class="bars__bar" :style="{ animationDuration: bar.duration, animationDelay: bar.delay }" />
    </span>
</template>

<script setup lang="ts">
const { active, count = 14, height = 36, color = 'var(--ink)' } = defineProps<{ active: boolean; count?: number; height?: number; color?: string }>()

const bars = computed(() =>
    Array.from({ length: count }, (_, index) => ({
        index,
        duration: `${(0.5 + ((index * 37) % 10) / 14).toFixed(2)}s`,
        delay: `${(-(index * 0.13)).toFixed(2)}s`,
    })),
)
</script>

<style scoped>
.bars {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    height: var(--bars-height);
}

.bars__bar {
    width: 6px;
    height: var(--bars-height);
    border-radius: 3px;
    background: var(--bars-color);
    transform: scaleY(0.25);
}

.bars--on .bars__bar {
    animation: bars-bounce 0.9s ease-in-out infinite;
}

@keyframes bars-bounce {
    0%,
    100% {
        transform: scaleY(0.25);
    }
    50% {
        transform: scaleY(1);
    }
}

@media (prefers-reduced-motion: reduce) {
    .bars--on .bars__bar {
        animation: none;
        transform: scaleY(0.6);
    }
}
</style>
