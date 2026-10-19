<template>
    <section class="magic stack center" :aria-busy="phase === 'checking'">
        <AppLogo :size="96" />
        <div v-if="phase === 'checking'" class="magic__dots" aria-hidden="true"><span /><span /><span /></div>
        <span v-else class="magic__badge" :class="{ 'magic__badge--failed': phase === 'failed' }" aria-hidden="true">
            <AppIcon :name="phase === 'success' ? 'check' : 'timer-off'" :size="52" />
        </span>
        <h1 class="title" role="status">{{ phase === 'success' ? t('auth.magic.success') : phase === 'checking' ? t('auth.magic.title') : failure }}</h1>
        <template v-if="phase === 'success'">
            <p class="magic__text">{{ t('auth.magic.successText') }}</p>
            <AppButton icon="next" is-block @click="proceed">{{ t('common.continue') }}</AppButton>
        </template>
        <template v-else-if="phase === 'failed'">
            <AppButton icon="send" to="/login" is-block>{{ t('auth.magic.retry') }}</AppButton>
        </template>
    </section>
</template>

<script setup lang="ts">
const { t } = useI18n()
const { phase, failure, verify, proceed } = useMagicLinkVerification()
onMounted(verify)
</script>

<style scoped>
.magic {
    width: 100%;
    max-width: 440px;
    min-height: 80dvh;
    margin-inline: auto;
    justify-content: center;
    gap: 24px;
    text-align: center;
    overflow-wrap: anywhere;
}

.magic__text {
    margin: 0;
    color: var(--ink-soft);
    font-size: 1.125rem;
    line-height: 1.5;
}

.magic__badge {
    display: grid;
    place-items: center;
    width: 100px;
    height: 100px;
    border: var(--outline) solid var(--ink);
    border-radius: 50%;
    background: var(--mint);
    color: var(--on-accent);
    box-shadow: var(--shadow-lg);
}

.magic__badge--failed {
    background: var(--coral);
}

.magic__dots {
    display: flex;
    gap: 12px;
}

.magic__dots span {
    width: 20px;
    height: 20px;
    border: var(--outline) solid var(--ink);
    border-radius: 50%;
    background: var(--yellow);
    animation: magic-hop 1s ease-in-out infinite;
}

.magic__dots span:nth-child(2) {
    background: var(--mint);
    animation-delay: 0.15s;
}

.magic__dots span:nth-child(3) {
    background: var(--pink);
    animation-delay: 0.3s;
}

@keyframes magic-hop {
    50% { transform: translateY(-12px); }
}

@media (prefers-reduced-motion: reduce) {
    .magic__dots span { animation: none; }
}
</style>
