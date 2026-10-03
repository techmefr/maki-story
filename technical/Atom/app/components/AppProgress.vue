<template>
    <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" :aria-valuenow="percent" :aria-label="label">
        <div class="progress__fill" :style="{ width: `${percent}%` }" />
    </div>
</template>

<script setup lang="ts">
const props = defineProps<{ value: number; label: string }>()

const percent = computed(() => Math.min(100, Math.max(0, Math.round(props.value))))
</script>
