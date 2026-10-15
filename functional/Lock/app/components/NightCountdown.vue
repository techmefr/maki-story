<template>
    <p v-if="minutes !== null" class="night-countdown" role="status" data-testid="night-countdown">
        <AppIcon name="moon" :size="20" aria-hidden="true" />
        {{ t('accessControls.countdown', { minutes }) }}
    </p>
</template>

<script setup lang="ts">
const TICK_MS = 15000
const MS_PER_MINUTE = 60000

const { t } = useI18n()
const { nightStartsAt } = useAccess()

const now = ref(Date.now())
let timer: ReturnType<typeof setInterval> | undefined

const minutes = computed<number | null>(() => {
    if (!nightStartsAt.value) {
        return null
    }
    const remaining = Math.ceil((Date.parse(nightStartsAt.value) - now.value) / MS_PER_MINUTE)
    return remaining > 0 && remaining <= NIGHT_WARNING_MINUTES ? remaining : null
})

onMounted(() => {
    timer = setInterval(() => {
        now.value = Date.now()
    }, TICK_MS)
})

onBeforeUnmount(() => clearInterval(timer))
</script>

<style scoped>
.night-countdown {
    position: fixed;
    inset-block-start: 12px;
    inset-inline: 0;
    margin-inline: auto;
    width: fit-content;
    max-width: calc(100% - 24px);
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 14px;
    border: var(--outline) solid var(--ink);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    box-shadow: var(--shadow);
    font: 700 1rem/1.2 var(--font-title);
    z-index: 5;
}
</style>
