<template>
    <section class="sent" role="status" data-testid="message-sent">
        <span class="sent__seal" aria-hidden="true"><AppIcon name="check" :size="54" :stroke-width="3" /></span>
        <h2 class="sent__title">{{ title }}</h2>
        <p class="sent__text">{{ text }}</p>
        <AppButton icon="plus" data-testid="message-another" @click="emit('again')">{{ t('messages.compose.another') }}</AppButton>
    </section>
</template>

<script setup lang="ts">
defineProps<{ title: string; text: string }>()
const emit = defineEmits<{ again: [] }>()

const { t } = useI18n()
</script>

<style scoped>
.sent {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    padding: 20px 0;
    text-align: center;
}

.sent__seal {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100px;
    height: 100px;
    border: var(--outline) solid var(--ink);
    border-radius: 50%;
    background: var(--mint);
    box-shadow: var(--shadow-lg);
    color: var(--on-accent);
}

.sent__title {
    margin: 0;
    font: 700 1.75rem/1.15 var(--font-title);
}

.sent__text {
    margin: 0;
    color: var(--ink-soft);
    font-size: 1.125rem;
}
</style>
