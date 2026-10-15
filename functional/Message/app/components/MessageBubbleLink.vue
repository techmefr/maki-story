<template>
    <NuxtLink
        :to="`/message/listen/${messageId}`"
        class="bubble-link"
        :class="[`bubble-link--${variant}`, { 'bubble-link--birthday': kind === 'BIRTHDAY', 'anim-bounce': variant === 'kid' }]"
        :style="{ background: color }"
        :aria-label="t('homeCards.bubbleLabel', { name, count })"
    >
        <AppIcon :name="kind === 'BIRTHDAY' ? 'party' : 'message-heart'" :size="22" motion="wiggle" />
        {{ kind === 'BIRTHDAY' ? t('kid.birthday.bubble') : t('homeCards.bubble') }}
        <span class="bubble-link__count" data-bubble-count>{{ formatNumber(count) }}</span>
    </NuxtLink>
</template>

<script setup lang="ts">
withDefaults(
    defineProps<{
        messageId: string
        kind: IMessage['kind']
        count: number
        name: string
        color: string
        variant?: 'kid' | 'adult'
    }>(),
    { variant: 'adult' },
)

const { t, formatNumber } = useI18n()
</script>

<style scoped>
.bubble-link {
    position: absolute;
    top: -8px;
    inset-inline-end: 6px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 48px;
    padding: 8px 14px;
    border: 2.5px solid var(--ink);
    border-radius: 999px;
    box-shadow: var(--shadow);
    font: 700 0.9375rem/1 var(--font-title);
    text-decoration: none;
}

.bubble-link--adult {
    color: var(--on-accent);
}

.bubble-link--kid {
    color: var(--ink);
}

.bubble-link:focus-visible {
    outline: 4px solid var(--ink);
    outline-offset: 3px;
}

.bubble-link--birthday {
    outline: 3px dashed var(--ink);
    outline-offset: 2px;
}

.bubble-link--birthday:focus-visible {
    outline: 4px solid var(--ink);
}

.bubble-link__count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 26px;
    height: 26px;
    border: 2.5px solid var(--ink);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font-size: 0.875rem;
}
</style>
