<template>
    <div class="curtain" :class="`curtain--${phase}`" aria-hidden="true">
        <div v-for="(color, index) in colors" :key="color.id" class="curtain__band" :style="{ background: color.hex, '--i': index }" />
        <AppMaki class="curtain__maki" :size="96" />
    </div>
</template>

<script setup lang="ts">
const COVER_MS = 300
const SAFETY_MS = 1800

const colors = VOICE_COLORS.slice(0, 4)
const phase = ref<'idle' | 'in' | 'out'>('idle')
const nuxtApp = useNuxtApp()
let coveredAt = 0
let safetyTimer: ReturnType<typeof setTimeout> | null = null
let releaseTimer: ReturnType<typeof setTimeout> | null = null

const clearTimers = (): void => {
    if (safetyTimer) {
        clearTimeout(safetyTimer)
    }
    if (releaseTimer) {
        clearTimeout(releaseTimer)
    }
}

const release = (): void => {
    clearTimers()
    phase.value = 'out'
    releaseTimer = setTimeout(() => {
        phase.value = 'idle'
    }, COVER_MS + 200)
}

nuxtApp.hook('page:start', () => {
    clearTimers()
    coveredAt = Date.now()
    phase.value = 'in'
    safetyTimer = setTimeout(release, SAFETY_MS)
})

nuxtApp.hook('page:finish', () => {
    const wait = Math.max(0, COVER_MS - (Date.now() - coveredAt))
    clearTimers()
    releaseTimer = setTimeout(release, wait)
})

onBeforeUnmount(clearTimers)
</script>

<style scoped>
.curtain {
    position: fixed;
    inset: 0;
    z-index: 100;
    pointer-events: none;
    display: flex;
    visibility: hidden;
}

.curtain--in,
.curtain--out {
    visibility: visible;
}

.curtain__band {
    flex: 1;
    transform: translateY(-101%);
    border-left: 3px solid var(--ink);
}

.curtain--in .curtain__band {
    animation: band-in 0.3s cubic-bezier(0.7, 0, 0.3, 1) forwards;
    animation-delay: calc(var(--i) * 40ms);
}

.curtain--out .curtain__band {
    transform: translateY(0);
    animation: band-out 0.3s cubic-bezier(0.7, 0, 0.3, 1) forwards;
    animation-delay: calc(var(--i) * 40ms);
}

.curtain__maki {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    opacity: 0;
}

.curtain--in .curtain__maki {
    animation: maki-pop 0.4s ease-out 0.15s forwards;
}

@keyframes band-in {
    to {
        transform: translateY(0);
    }
}

@keyframes band-out {
    to {
        transform: translateY(101%);
    }
}

@keyframes maki-pop {
    0% {
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.4) rotate(-12deg);
    }
    100% {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1) rotate(0);
    }
}

@media (prefers-reduced-motion: reduce) {
    .curtain {
        display: none;
    }
}
</style>
