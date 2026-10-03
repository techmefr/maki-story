<template>
    <span class="bubble" role="img" :aria-label="t('messages.bubble.label', { count })">
        <svg class="bubble__shape" viewBox="0 0 62 58" aria-hidden="true" focusable="false">
            <path
                d="M12 3h38a9 9 0 0 1 9 9v22a9 9 0 0 1-9 9H27l-13 12 2-12h-4a9 9 0 0 1-9-9V12a9 9 0 0 1 9-9z"
                transform="translate(1.5 1)"
                fill="var(--yellow)"
                stroke="var(--ink)"
                stroke-width="3"
                stroke-linejoin="round"
            />
        </svg>
        <span class="bubble__count" aria-hidden="true">{{ formatNumber(count) }}</span>
    </span>
</template>

<script setup lang="ts">
defineProps<{ count: number }>()

const { t, formatNumber } = useI18n()
</script>

<style scoped>
.bubble {
    position: relative;
    display: inline-flex;
    align-items: flex-start;
    justify-content: center;
    width: 62px;
    height: 58px;
}

.bubble__shape {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
}

.bubble__count {
    position: relative;
    margin-top: 9px;
    color: var(--on-accent);
    font: 700 1.5rem/1 var(--font-title);
}
</style>
