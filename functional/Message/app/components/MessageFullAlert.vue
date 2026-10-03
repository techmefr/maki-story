<template>
    <section class="alert" role="alert" data-testid="message-full">
        <h2 class="alert__title">{{ t('messages.full.title', { limit: formatNumber(limit), name }) }}</h2>
        <p class="alert__body">{{ t('messages.full.body') }}</p>
        <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
        <AppButton variant="destructive" is-block icon="trash" :loading="isBusy" data-testid="message-retract" @click="emit('retract')">
            {{ t('messages.full.retract') }}
        </AppButton>
    </section>
</template>

<script setup lang="ts">
defineProps<{ name: string; limit: number; isBusy: boolean; errorMessage: string }>()
const emit = defineEmits<{ retract: [] }>()

const { t, formatNumber } = useI18n()
</script>

<style scoped>
.alert {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 14px 16px;
    border: var(--outline) solid var(--ink);
    border-radius: 22px;
    background: var(--danger-soft);
    color: var(--on-accent);
}

.alert__title {
    margin: 0;
    font: 700 1.1875rem/1.2 var(--font-title);
}

.alert__body {
    margin: 0;
    font-size: 1rem;
}

.alert .error {
    margin: 0;
    color: var(--on-accent);
}
</style>
