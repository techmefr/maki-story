<template>
    <span class="blob" :class="{ 'blob--active': active }" :style="{ '--blob-color': color, '--blob-size': `${size}px` }">
        <span class="blob__ring" aria-hidden="true" />
        <slot />
    </span>
</template>

<script setup lang="ts">
const { active = false, color, size = 200 } = defineProps<{ active?: boolean; color: string; size?: number }>()
</script>

<style scoped>
.blob {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: calc(var(--blob-size) * 0.07);
}

.blob__ring {
    position: absolute;
    inset: 0;
    border: 6px solid var(--blob-color);
    border-radius: 50%;
    background: color-mix(in srgb, var(--blob-color) 25%, transparent);
    transition:
        border-color 0.4s,
        background 0.4s;
    will-change: transform;
}

.blob--active .blob__ring {
    animation:
        blob-morph 5s ease-in-out infinite,
        blob-spin 14s linear infinite;
}

@keyframes blob-morph {
    0%,
    100% {
        border-radius: 58% 42% 55% 45% / 48% 56% 44% 52%;
    }
    33% {
        border-radius: 44% 56% 42% 58% / 56% 44% 58% 42%;
    }
    66% {
        border-radius: 52% 48% 60% 40% / 42% 58% 46% 54%;
    }
}

@keyframes blob-spin {
    to {
        transform: rotate(360deg);
    }
}

@media (prefers-reduced-motion: reduce) {
    .blob__ring,
    .blob--active .blob__ring {
        animation: none;
        transition: none;
    }
}
</style>
