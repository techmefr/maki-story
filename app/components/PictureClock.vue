<template>
    <svg class="clock" viewBox="0 0 200 200" role="img" :aria-label="label">
        <circle cx="100" cy="100" r="92" fill="#FFFFFF" stroke="#1F1B3A" stroke-width="7" />
        <line
            v-for="tick in 12"
            :key="tick"
            x1="100"
            y1="16"
            x2="100"
            :y2="tick % 3 === 0 ? 34 : 26"
            stroke="#1F1B3A"
            stroke-width="6"
            stroke-linecap="round"
            :transform="`rotate(${tick * 30} 100 100)`"
        />
        <template v-if="time">
            <line x1="100" y1="100" x2="100" y2="52" stroke="#1F1B3A" stroke-width="10" stroke-linecap="round" :transform="`rotate(${hourAngle} 100 100)`" />
            <line x1="100" y1="100" x2="100" y2="34" stroke="#F4695A" stroke-width="7" stroke-linecap="round" :transform="`rotate(${minuteAngle} 100 100)`" />
        </template>
        <circle cx="100" cy="100" r="8" fill="#1F1B3A" />
        <g v-if="!time" transform="translate(100 70)">
            <path d="M-12 -14 A16 16 0 1 0 14 8 A13 13 0 0 1 -12 -14 Z" fill="#FFC940" stroke="#1F1B3A" stroke-width="4" stroke-linejoin="round" />
        </g>
    </svg>
</template>

<script setup lang="ts">
const { time = null, label = '' } = defineProps<{ time?: Date | null; label?: string }>()

const MINUTES_PER_HOUR = 60
const HOURS_ON_FACE = 12
const DEGREES_PER_HOUR = 30

const minuteAngle = computed(() => (time ? time.getMinutes() * 6 : 0))
const hourAngle = computed(() => (time ? ((time.getHours() % HOURS_ON_FACE) + time.getMinutes() / MINUTES_PER_HOUR) * DEGREES_PER_HOUR : 0))
</script>

<style scoped>
.clock {
    width: min(60vw, 36dvh, 22rem);
    height: auto;
    display: block;
}
</style>
