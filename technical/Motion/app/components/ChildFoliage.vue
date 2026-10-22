<template>
    <div class="foliage" :data-moving="isFoliageEnabled" aria-hidden="true">
        <div class="foliage__edges">
            <span v-for="leaf in leaves" :key="leaf.id" class="foliage__leaf" :class="`foliage__leaf--${leaf.side}`" :style="leaf.style">
                <img :src="leaf.src" alt="" width="360" height="780" draggable="false" decoding="async" />
            </span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useFoliageMotion } from '../composables/useFoliageMotion'
const { isFoliageEnabled } = useFoliageMotion()
const composition = [
    { side: 'left', shape: 'curved', root: 38, scale: 0.68, angle: 36, start: -5, end: 7, duration: 3.9, delay: -2.3, opacity: 0.76, depth: 0 },
    { side: 'right', shape: 'upright', root: 47, scale: 0.76, angle: 21, start: -8, end: 4, duration: 3.4, delay: -0.8, opacity: 0.82, depth: 0 },
    { side: 'left', shape: 'upright', root: 61, scale: 0.81, angle: 16, start: -6, end: 8, duration: 3.1, delay: -1.5, opacity: 0.9, depth: 1 },
    { side: 'right', shape: 'curved', root: 65, scale: 0.92, angle: 32, start: -7, end: 5, duration: 2.85, delay: -2.6, opacity: 1, depth: 2 },
    { side: 'left', shape: 'curved', root: 78, scale: 1.06, angle: 41, start: -8, end: 4, duration: 3.55, delay: -0.6, opacity: 0.8, depth: 0 },
    { side: 'left', shape: 'upright', root: 73, scale: 0.96, angle: 25, start: -8, end: 6, duration: 2.7, delay: -0.9, opacity: 1, depth: 2 },
    { side: 'right', shape: 'upright', root: 88, scale: 0.69, angle: 13, start: -4, end: 9, duration: 3.8, delay: -1.9, opacity: 0.78, depth: 0 },
    { side: 'left', shape: 'upright', root: 96, scale: 0.73, angle: 12, start: -5, end: 8, duration: 3.7, delay: -3.1, opacity: 0.86, depth: 1 },
    { side: 'right', shape: 'curved', root: 106, scale: 1.16, angle: 37, start: -9, end: 4, duration: 3.2, delay: -0.4, opacity: 0.84, depth: 0 },
    { side: 'right', shape: 'upright', root: 97, scale: 1.08, angle: 19, start: -5, end: 9, duration: 3.65, delay: -1.7, opacity: 1, depth: 2 },
    { side: 'left', shape: 'curved', root: 118, scale: 1.2, angle: 32, start: -5, end: 8, duration: 3.2, delay: -2.1, opacity: 1, depth: 2 },
    { side: 'left', shape: 'upright', root: 132, scale: 0.94, angle: 19, start: -6, end: 5, duration: 2.95, delay: -1.1, opacity: 0.85, depth: 1 },
    { side: 'right', shape: 'curved', root: 129, scale: 0.86, angle: 28, start: -7, end: 7, duration: 3.45, delay: -2.9, opacity: 0.9, depth: 1 },
]
const leaves = composition.map((leaf, id) => {
    const stem = leaf.shape === 'upright' ? 0.43 : 0.65
    return {
        id,
        side: leaf.side,
        src: `/art/child/ravenala-leaf-${leaf.shape}.webp`,
        style: {
            '--leaf-root': `${leaf.root}%`,
            '--leaf-scale': leaf.scale,
            '--leaf-opacity': leaf.opacity,
            '--leaf-depth': leaf.depth,
            '--leaf-angle': `${leaf.angle}deg`,
            '--leaf-duration': `${leaf.duration}s`,
            '--leaf-sway-start': `${leaf.start}deg`,
            '--leaf-sway-end': `${leaf.end}deg`,
            '--leaf-delay': `${leaf.delay}s`,
            '--leaf-stem-ratio': stem,
            '--leaf-stem-origin': `${stem * 100}%`,
        },
    }
})
</script>

<style scoped>
.foliage {
    position: fixed;
    inset: 0;
    z-index: -1;
    overflow: hidden;
    pointer-events: none;
    mask-image: linear-gradient(to bottom, transparent 0, transparent var(--child-header-clearance, 0px), #000 calc(var(--child-header-clearance, 0px) + 100px));
}

.foliage__edges {
    position: absolute;
    inset: 0;
    overflow: hidden;
    mask-image: linear-gradient(to right, #000 0, #000 6%, transparent 20%, transparent 80%, #000 94%, #000 100%);
}

.foliage__leaf {
    --leaf-width: calc(clamp(120px, 17vw, 380px) * var(--leaf-scale));
    position: absolute;
    top: var(--leaf-root);
    opacity: var(--leaf-opacity);
    z-index: var(--leaf-depth);
    width: 0;
    height: 0;
    transform-origin: 0 0;
    animation: foliage-sway var(--leaf-duration) ease-in-out var(--leaf-delay) infinite alternate;
}

.foliage__leaf--left { left: -16px; }
.foliage__leaf--right { right: -20px; }
.foliage__leaf img {
    position: absolute;
    bottom: 0;
    left: calc(var(--leaf-width) * var(--leaf-stem-ratio) * -1);
    display: block;
    width: var(--leaf-width);
    max-width: none;
    height: auto;
    transform-origin: var(--leaf-stem-origin) 100%;
    transform: rotate(var(--leaf-angle));
}
.foliage__leaf--right img { transform: scaleX(-1) rotate(var(--leaf-angle)); }
.foliage[data-moving="false"] .foliage__leaf { animation-play-state: paused; }

@keyframes foliage-sway {
    from { transform: rotate(var(--leaf-sway-start)); }
    to { transform: rotate(var(--leaf-sway-end)); }
}

@media (prefers-reduced-motion: reduce) {
    .foliage__leaf { animation: none; }
}
</style>
