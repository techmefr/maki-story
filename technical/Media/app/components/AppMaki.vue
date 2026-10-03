<template>
    <svg viewBox="0 0 120 120" :width="size" :height="size" style="display: block; overflow: visible" aria-hidden="true" focusable="false">
        <path d="M31 42 L22 12 L50 30 Z" fill="#8E889C" />
        <path d="M89 42 L98 12 L70 30 Z" fill="#8E889C" />
        <path d="M31 38 L27 21 L42 31 Z" fill="#2B2640" />
        <path d="M89 38 L93 21 L78 31 Z" fill="#2B2640" />
        <ellipse cx="60" cy="64" rx="37" ry="35" fill="#AFA9BE" />
        <ellipse cx="60" cy="70" rx="29" ry="28" fill="#FFFFFF" />
        <g class="maki__eyes">
        <ellipse cx="46" cy="64" rx="11.5" ry="13" fill="#2B2640" transform="rotate(-22 46 64)" />
        <ellipse cx="74" cy="64" rx="11.5" ry="13" fill="#2B2640" transform="rotate(22 74 64)" />
        <circle cx="46.5" cy="63" r="8" fill="#FFB547" />
        <circle cx="73.5" cy="63" r="8" fill="#FFB547" />
        <circle cx="47.5" cy="63.5" r="4" fill="#1C1A22" />
        <circle cx="72.5" cy="63.5" r="4" fill="#1C1A22" />
        <circle cx="49" cy="61.5" r="1.5" fill="#FFFFFF" />
        <circle cx="74" cy="61.5" r="1.5" fill="#FFFFFF" />
        </g>
        <path d="M60 73 L53 85 Q60 90 67 85 Z" fill="#2B2640" />
        <path d="M54 91 Q60 95 66 91" stroke="#2B2640" stroke-width="2.4" fill="none" stroke-linecap="round" />
        <path d="M21 60 C18 12 102 12 99 60" :stroke="phones" stroke-width="7.5" fill="none" stroke-linecap="round" />
        <rect x="12" y="52" width="17" height="28" rx="8.5" :fill="phones" />
        <rect x="91" y="52" width="17" height="28" rx="8.5" :fill="phones" />
        <rect x="17" y="58" width="7" height="16" rx="3.5" fill="#FFFFFF" opacity=".35" />
        <rect x="96" y="58" width="7" height="16" rx="3.5" fill="#FFFFFF" opacity=".35" />
    </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ phones?: string; size?: number }>(), {
    phones: '#F4695A',
    size: 64,
})
</script>

<style scoped>
.maki__eyes {
    transform-box: view-box;
    transform-origin: 60px 64px;
    animation: maki-blink 5s ease-in-out infinite;
}

@keyframes maki-blink {
    0%,
    92%,
    100% {
        transform: scaleY(1);
    }
    95% {
        transform: scaleY(0.08);
    }
}
</style>
