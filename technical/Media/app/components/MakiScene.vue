<template>
    <img :src="src" alt="" aria-hidden="true" class="scene" :style="{ '--scene-max': `${size}px` }" loading="lazy" decoding="async" data-testid="maki-scene" />
</template>

<script setup lang="ts">
const { pose, size = 200 } = defineProps<{ pose: MakiPose; size?: number }>()

const src = computed(() => makiSrc(pose))
</script>

<style scoped>
.scene {
    display: block;
    width: min(var(--scene-max), 56vw);
    height: auto;
    max-height: min(34vh, var(--scene-max));
    margin-inline: auto;
    object-fit: contain;
    pointer-events: none;
    user-select: none;
}
</style>
