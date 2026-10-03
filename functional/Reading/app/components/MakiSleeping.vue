<template>
    <div class="sleeping" :style="{ width: `${size}px` }" aria-hidden="true">
        <svg viewBox="0 0 120 120" :width="size" :height="size" style="display: block; overflow: visible" focusable="false">
            <path d="M31 42 L22 12 L50 30 Z" fill="#8E889C" />
            <path d="M89 42 L98 12 L70 30 Z" fill="#8E889C" />
            <path d="M31 38 L27 21 L42 31 Z" fill="#2B2640" />
            <path d="M89 38 L93 21 L78 31 Z" fill="#2B2640" />
            <ellipse cx="60" cy="64" rx="37" ry="35" fill="#AFA9BE" />
            <ellipse cx="60" cy="70" rx="29" ry="28" fill="#FFFFFF" />
            <ellipse cx="46" cy="64" rx="11.5" ry="13" fill="#2B2640" transform="rotate(-22 46 64)" />
            <ellipse cx="74" cy="64" rx="11.5" ry="13" fill="#2B2640" transform="rotate(22 74 64)" />
            <path d="M38 64 Q46 71 54 64" stroke="#FFB547" stroke-width="3.4" fill="none" stroke-linecap="round" />
            <path d="M66 64 Q74 71 82 64" stroke="#FFB547" stroke-width="3.4" fill="none" stroke-linecap="round" />
            <path d="M60 73 L53 85 Q60 90 67 85 Z" fill="#2B2640" />
            <path d="M54 91 Q60 95 66 91" stroke="#2B2640" stroke-width="2.4" fill="none" stroke-linecap="round" />
            <path d="M21 60 C18 12 102 12 99 60" stroke="#F4695A" stroke-width="7.5" fill="none" stroke-linecap="round" />
            <rect x="12" y="52" width="17" height="28" rx="8.5" fill="#F4695A" />
            <rect x="91" y="52" width="17" height="28" rx="8.5" fill="#F4695A" />
        </svg>
        <span class="sleeping__z sleeping__z--1" />
        <span class="sleeping__z sleeping__z--2" />
        <span class="sleeping__z sleeping__z--3" />
    </div>
</template>

<script setup lang="ts">
const { size = 180 } = defineProps<{ size?: number }>()
</script>

<style scoped>
.sleeping {
    position: relative;
    max-width: 100%;
}

.sleeping__z {
    position: absolute;
    inset-inline-end: -4%;
    top: 4%;
    font: 700 1.5rem/1 var(--font-title);
    color: #ffc940;
    opacity: 0;
    animation: sleeping-float 3.2s ease-in-out infinite;
}

.sleeping__z::before {
    content: 'Z';
}

.sleeping__z--2 {
    animation-delay: 1s;
    font-size: 1.25rem;
}

.sleeping__z--3 {
    animation-delay: 2s;
    font-size: 1rem;
}

@keyframes sleeping-float {
    0% {
        transform: translate(0, 0) scale(0.7);
        opacity: 0;
    }
    30% {
        opacity: 1;
    }
    100% {
        transform: translate(16px, -36px) scale(1.1);
        opacity: 0;
    }
}

@media (prefers-reduced-motion: reduce) {
    .sleeping__z {
        animation: none;
        opacity: 1;
    }

    .sleeping__z--1 {
        transform: translate(8px, -10px);
    }

    .sleeping__z--2 {
        transform: translate(16px, -28px);
    }

    .sleeping__z--3 {
        transform: translate(22px, -44px);
    }
}
</style>
