<template>
    <div class="curtain" :class="[`curtain--${phase}`, `curtain--${kind}`]" aria-hidden="true">
        <template v-if="kind !== 'bars'">
            <div class="curtain__cover curtain__cover--left" />
            <div class="curtain__cover curtain__cover--right" />
        </template>
        <div v-for="(color, index) in colors" v-show="kind === 'bars'" :key="color.id" class="curtain__band" :style="{ background: color.hex, '--i': index }" />
        <MakiScene class="curtain__maki" pose="hello" :size="96" />
    </div>
</template>

<script setup lang="ts">
const COVER_MS = 300
const SAFETY_MS = 1800

const colors = VOICE_COLORS.slice(0, 4)
const kind = useState<string>('transition-kind', () => 'bars')
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

.curtain__cover {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 50%;
    background: var(--bg);
    display: none;
}

.curtain__cover--left {
    left: 0;
    border-right: 3px solid var(--ink);
    transform-origin: left center;
}

.curtain__cover--right {
    right: 0;
    border-left: 3px solid var(--ink);
    transform-origin: right center;
}

.curtain--book-open .curtain__cover,
.curtain--book-close .curtain__cover {
    display: block;
}

.curtain--book-open.curtain--in .curtain__cover--left {
    animation: cover-left-in 0.3s ease-out forwards;
}

.curtain--book-open.curtain--in .curtain__cover--right {
    animation: cover-right-in 0.3s ease-out forwards;
}

.curtain--book-open.curtain--out .curtain__cover--left {
    animation: cover-left-in 0.3s ease-in reverse forwards;
}

.curtain--book-open.curtain--out .curtain__cover--right {
    animation: cover-right-in 0.3s ease-in reverse forwards;
}

.curtain--book-close.curtain--in .curtain__cover--left,
.curtain--book-close.curtain--in .curtain__cover--right {
    animation: cover-slide-in 0.3s ease-out forwards;
}

.curtain--book-close.curtain--out .curtain__cover--left,
.curtain--book-close.curtain--out .curtain__cover--right {
    animation: cover-slide-in 0.3s ease-in reverse forwards;
}

.curtain--book-close .curtain__cover--left {
    --slide: -100%;
}

.curtain--book-close .curtain__cover--right {
    --slide: 100%;
}

.curtain--book-open .curtain__maki,
.curtain--book-close .curtain__maki {
    z-index: 1;
}

@keyframes cover-left-in {
    from {
        transform: perspective(900px) rotateY(80deg);
    }
    to {
        transform: perspective(900px) rotateY(0);
    }
}

@keyframes cover-slide-in {
    from {
        transform: translateX(var(--slide));
    }
    to {
        transform: translateX(0);
    }
}

@keyframes cover-right-in {
    from {
        transform: perspective(900px) rotateY(-80deg);
    }
    to {
        transform: perspective(900px) rotateY(0);
    }
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
