<template>
    <svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor" :stroke-width="strokeWidth" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
        <path :d="TAG_ICON_PATHS[icon]" />
    </svg>
</template>

<script setup lang="ts">
const { size = 28, strokeWidth = 1.9 } = defineProps<{ icon: TagIconId; size?: number; strokeWidth?: number }>()
</script>
