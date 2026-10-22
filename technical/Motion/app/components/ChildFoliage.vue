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
const angles = [6, -8, 12]
const leaves = Array.from({ length: 6 }, (_, id) => {
    const index = id % 3
    return {
        id,
        side: id < 3 ? 'left' : 'right',
        src: `/art/child/ravenala-leaf-${index % 2 ? 'curved' : 'upright'}.webp`,
        style: {
            '--leaf-top': `${38 + index * 25}%`,
            '--leaf-angle': `${angles[index]}deg`,
            '--leaf-duration': `${2.6 + id * 0.26}s`,
            '--leaf-sway-start': `${-6 - index * 1.2}deg`,
            '--leaf-sway-end': `${7 + index * 1.1}deg`,
            '--leaf-drift': `${7 + index * 2}px`,
            '--leaf-delay': `${-id * 1.19}s`,
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
    --leaf-width: clamp(100px, 15vw, 360px);
    position: absolute;
    top: var(--leaf-top);
    width: var(--leaf-width);
    transform-origin: 50% 100%;
    animation: foliage-sway var(--leaf-duration) ease-in-out var(--leaf-delay) infinite alternate;
}

.foliage__leaf--left { left: calc(var(--leaf-width) * -0.48); }
.foliage__leaf--right { right: calc(var(--leaf-width) * -0.48); }
.foliage__leaf img { display: block; width: 100%; height: auto; transform: rotate(var(--leaf-angle)); }
.foliage__leaf--right img { transform: scaleX(-1) rotate(var(--leaf-angle)); }
.foliage[data-moving="false"] .foliage__leaf { animation-play-state: paused; }

@keyframes foliage-sway {
    from { transform: translateX(calc(var(--leaf-drift) * -0.7)) rotate(var(--leaf-sway-start)); }
    to { transform: translateX(var(--leaf-drift)) rotate(var(--leaf-sway-end)); }
}

@media (prefers-reduced-motion: reduce) {
    .foliage__leaf { animation: none; }
}
</style>
