<template>
    <section class="results" data-testid="message-send-results">
        <h2 class="results__title">{{ t('homeCards.resultsTitle') }}</h2>
        <ul class="results__list" role="status">
            <li v-for="result in results" :key="result.id" class="results__item" :data-status="result.status">
                {{ t(`homeBar.result.${result.status}`, { name: result.name }) }}
            </li>
        </ul>
        <AppButton icon="plus" @click="emit('again')">{{ t('messages.compose.another') }}</AppButton>
    </section>
</template>

<script setup lang="ts">
defineProps<{ results: ISendResult[] }>()
const emit = defineEmits<{ again: [] }>()

const { t } = useI18n()
</script>

<style scoped>
.results {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 20px 0;
    text-align: center;
}

.results__title {
    margin: 0;
    font: 700 1.5rem/1.2 var(--font-title);
}

.results__list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;
}

.results__item {
    font: 600 1rem/1.3 var(--font-body);
}
</style>
