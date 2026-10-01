<template>
    <div class="sheet-backdrop" @click.self="emit('close')">
        <div class="sheet stack" role="dialog" aria-label="Minuteur de sommeil">
            <h2 class="subtitle">Dodo dans…</h2>
            <div class="sleep-grid">
                <button
                    v-for="option in SLEEP_CHOICES"
                    :key="option.id"
                    type="button"
                    class="btn btn--big-tile"
                    :class="{ 'btn--white': option.id !== active }"
                    :aria-pressed="option.id === active"
                    :aria-label="option.minutes === null ? 'Dormir à la fin de la page' : `Dormir dans ${option.minutes} minutes`"
                    @click="emit('select', option.id)"
                >
                    <AppIcon :name="option.minutes === null ? 'book' : 'moon'" :size="40" />
                    <span v-if="option.minutes !== null" class="sleep-grid__minutes">{{ option.minutes }}</span>
                </button>
            </div>
            <button v-if="active" type="button" class="btn btn--white btn--block" aria-label="Annuler le minuteur" @click="emit('cancel')">
                <AppIcon name="timer-off" :size="28" />
            </button>
            <button type="button" class="btn btn--white btn--block" aria-label="Fermer" @click="emit('close')">
                <AppIcon name="close" :size="28" />
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
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
    font-size: 40px;
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
