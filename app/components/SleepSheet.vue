<template>
    <div class="sheet-backdrop" @click.self="emit('close')">
        <div v-sheet="() => emit('close')" class="sheet stack" role="dialog" aria-modal="true" :aria-label="t('kid.listen.sleepTimer')">
            <h2 class="subtitle">{{ t('kid.sleep.title') }}</h2>
            <div class="sleep-grid">
                <button
                    v-for="option in SLEEP_CHOICES"
                    :key="option.id"
                    type="button"
                    class="btn btn--big-tile"
                    :class="{ 'btn--white': option.id !== active }"
                    :aria-pressed="option.id === active"
                    :aria-label="option.minutes === null ? t('kid.sleep.endOfPage') : t('kid.sleep.inMinutes', { count: option.minutes })"
                    @click="emit('select', option.id)"
                >
                    <AppIcon :name="option.minutes === null ? 'book' : 'moon'" :size="40" />
                    <span v-if="option.minutes !== null" class="sleep-grid__minutes">{{ formatNumber(option.minutes) }}</span>
                </button>
            </div>
            <button v-if="active" type="button" class="btn btn--white btn--block" :aria-label="t('kid.sleep.cancel')" @click="emit('cancel')">
                <AppIcon name="timer-off" :size="28" />
            </button>
            <button type="button" class="btn btn--white btn--block" :aria-label="t('common.close')" @click="emit('close')">
                <AppIcon name="close" :size="28" />
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
const { t, formatNumber } = useI18n()

defineProps<{ active: SleepChoiceId | null }>()

const emit = defineEmits<{
    select: [id: SleepChoiceId]
    cancel: []
    close: []
}>()
</script>

<style scoped>
.sleep-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
}

.btn--big-tile {
    min-height: 110px;
    font-size: 2.5rem;
    border-radius: 28px;
    flex-direction: column;
    gap: 4px;
}

.sleep-grid__minutes {
    font-family: Fredoka, sans-serif;
    font-weight: 700;
    line-height: 1;
}
</style>
