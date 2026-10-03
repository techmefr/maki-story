<template>
    <div v-if="mine.length > 0" class="outbox">
        <button type="button" class="outbox__pill" :class="`outbox__pill--${tone}`" data-testid="outbox-pill" @click="isOpen = true">
            <AppIcon :name="tone === 'sent' ? 'check' : 'cloud-off'" :size="20" />
            <span>{{ pillLabel }}</span>
        </button>
        <div v-if="isOpen" class="sheet-backdrop" @click.self="isOpen = false">
            <div v-sheet="close" class="sheet stack" role="dialog" aria-modal="true" aria-labelledby="outbox-title" data-testid="outbox-sheet">
                <div class="row">
                    <h2 id="outbox-title" class="subtitle grow">{{ t('outbox.title') }}</h2>
                    <AppButton variant="secondary" size="sm" is-round :aria-label="t('common.close')" @click="close">
                        <AppIcon name="close" :size="22" />
                    </AppButton>
                </div>
                <ul class="stack outbox__list" role="list">
                    <li v-for="item in mine" :key="item.id" class="card stack outbox__item" :data-status="item.status">
                        <div class="row">
                            <span class="subtitle grow">{{ item.label }}</span>
                            <span class="badge" role="status">{{ t(`outbox.status.${item.status}`) }}</span>
                        </div>
                        <p v-if="item.status === 'failed'" class="error" role="alert">{{ t('outbox.failedHint') }}</p>
                        <div v-if="item.status !== 'sent'" class="row row--wrap">
                            <AppButton v-if="item.status === 'failed'" variant="secondary" size="sm" @click="retry(item.id)">
                                <AppIcon name="redo" :size="18" />{{ t('common.retry') }}
                            </AppButton>
                            <AppButton variant="secondary" size="sm" tone="pink" @click="cancel(item.id)">
                                <AppIcon name="trash" :size="18" />{{ t('outbox.cancel') }}
                            </AppButton>
                        </div>
                    </li>
                </ul>
                <AppButton v-if="hasSent" variant="secondary" is-block @click="dismissSent">{{ t('outbox.clearSent') }}</AppButton>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
const { t, formatNumber } = useI18n()
const { mine, pendingCount, retry, cancel, dismissSent } = useOutbox()

const isOpen = ref(false)

const hasSent = computed(() => mine.value.some(item => item.status === 'sent'))
const hasFailed = computed(() => mine.value.some(item => item.status === 'failed'))
const tone = computed(() => (hasFailed.value ? 'failed' : pendingCount.value > 0 ? 'pending' : 'sent'))
const pillLabel = computed(() => {
    if (tone.value === 'failed') {
        return t('outbox.status.failed')
    }
    return tone.value === 'pending' ? t('outbox.pending', { value: formatNumber(pendingCount.value) }) : t('outbox.status.sent')
})

const close = (): void => {
    isOpen.value = false
}
</script>

<style scoped>
.outbox__pill {
    position: fixed;
    inset-inline-end: 12px;
    bottom: calc(env(safe-area-inset-bottom) + 5rem);
    z-index: 30;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    max-width: calc(100vw - 24px);
    min-height: var(--tap);
    padding: 8px 16px;
    border: 3px solid var(--ink);
    border-radius: 999px;
    background: var(--yellow);
    color: var(--on-accent);
    box-shadow: var(--shadow);
    font: 700 0.9375rem/1.15 var(--font-title);
    cursor: pointer;
    overflow-wrap: anywhere;
}

.outbox__pill--sent {
    background: var(--mint);
    color: var(--on-accent);
}

.outbox__pill--failed {
    background: var(--coral);
    color: var(--on-accent);
}

.outbox__list {
    list-style: none;
    margin: 0;
    padding: 0;
}

.outbox__item {
    gap: 8px;
}
</style>
