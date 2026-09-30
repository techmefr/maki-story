<template>
    <div class="wave" :style="{ height: `${height}px` }">
        <span
            v-for="(bar, index) in bars"
            :key="index"
            class="wave__bar"
            :style="{ height: `${bar}px`, background: color, opacity: isActive ? 1 : 0.3 }"
        />
    </div>
</template>

<script setup lang="ts">
const BAR_COUNT = 24
const TICK_MS = 90

const {
    isActive,
    color = '#1F1B3A',
    height = 56,
} = defineProps<{ isActive: boolean; color?: string; height?: number }>()

const phase = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

const bars = computed(() =>
    Array.from({ length: BAR_COUNT }, (_, index) => {
        if (!isActive) {
            return 6
        }
        const wave = Math.abs(Math.sin(phase.value * 0.8 + index * 1.4))
        const swell = 0.4 + 0.6 * Math.abs(Math.sin(index * 0.4 + phase.value * 0.2))
        return Math.round(8 + wave * (height - 10) * swell)
    }),
)

onMounted(() => {
    timer = setInterval(() => {
        phase.value += 1
    }, TICK_MS)
})

onBeforeUnmount(() => {
    if (timer) {
        clearInterval(timer)
    }
})
</script>

<style scoped>
.wave {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
}

.wave__bar {
    width: 6px;
    border-radius: 4px;
    transition: height 0.09s;
}
</style>
