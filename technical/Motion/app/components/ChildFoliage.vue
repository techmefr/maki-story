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
    { side: 'left', shape: 'upright', root: 70, scale: 0.92, angle: 24, start: -8, end: 6, duration: 2.7, delay: -0.9 },
    { side: 'left', shape: 'curved', root: 113, scale: 1.17, angle: 34, start: -5, end: 8, duration: 3.2, delay: -2.1 },
    { side: 'left', shape: 'upright', root: 43, scale: 0.72, angle: 18, start: -7, end: 5, duration: 3.8, delay: -2.8 },
    { side: 'right', shape: 'upright', root: 91, scale: 1.08, angle: 18, start: -5, end: 9, duration: 3.65, delay: -1.7 },
    { side: 'right', shape: 'curved', root: 55, scale: 0.83, angle: 26, start: -9, end: 4, duration: 2.9, delay: -0.4 },
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
    mask-image: linear-gradient(to right, #000 0, #000 3%, transparent 20%, transparent 80%, #000 97%, #000 100%);
}

.foliage__leaf {
    --leaf-width: calc(clamp(120px, 17vw, 380px) * var(--leaf-scale));
    position: absolute;
    top: var(--leaf-root);
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
