<template>
    <div class="stack narrow">
        <BackLink :to="backPath" />
        <AppPageIntro icon="download" tone="mint-soft" :title="t('home.storage.title')" />
        <section class="stack storage__card" aria-labelledby="storage-usage">
            <h2 id="storage-usage" class="subtitle">{{ usageLabel }}</h2>
            <AppProgress :value="usedPercent" :label="t('home.storage.title')" />
            <p class="storage__hint">{{ t('home.storage.downloaded', { size: formatBytes(totalBytes) }) }}</p>
            <AppBadge v-if="usage.isPersisted" tone="success">{{ t('home.storage.protected') }}</AppBadge>
            <AppButton v-else variant="secondary" size="sm" icon="lock" @click="keep">{{ t('home.storage.keep') }}</AppButton>
        </section>
        <AppEmpty v-if="list.length === 0" kind="offline" :title="t('home.storage.emptyTitle')" :hint="t('home.storage.emptyHint')" />
        <ul class="storage__list">
            <li v-for="record in list" :key="record.id" data-offline-book>
                <AppListRow :title="record.title" :subtitle="record.isComplete ? formatBytes(bytesOf(record)) : `${formatBytes(bytesOf(record))} · ${t('home.storage.incomplete')}`">
                    <template #lead><span class="storage__icon"><AppIcon name="book" :size="22" /></span></template>
                    <template #action>
                        <AppIconButton icon="trash" tone="coral" :label="t('home.storage.removeOne', { title: record.title })" @click="remove(record.id)" />
                    </template>
                </AppListRow>
            </li>
        </ul>
        <AppButton v-if="list.length > 0" variant="secondary" is-block icon="trash" @click="isConfirmingAll = true">{{ t('home.storage.removeAll') }}</AppButton>
        <AppBottomSheet :open="isConfirmingAll" :title="t('home.storage.removeAllTitle')" @close="isConfirmingAll = false">
            <p class="storage__hint">{{ t('home.storage.removeAllText') }}</p>
            <div class="row">
                <AppButton variant="secondary" class="grow" @click="isConfirmingAll = false">{{ t('common.cancel') }}</AppButton>
                <AppButton class="grow" icon="trash" @click="confirmRemoveAll">{{ t('home.storage.removeAll') }}</AppButton>
            </div>
        </AppBottomSheet>
    </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const { list, totalBytes, usage, bytesOf, refresh, remove, removeAll, requestPersistence } = useOfflineBooks()

const usedPercent = computed(() => {
    if (!usage.value.usedBytes || !usage.value.quotaBytes) {
        return 0
    }
    return Math.min(100, Math.max(1, Math.round((usage.value.usedBytes / usage.value.quotaBytes) * 100)))
})
const usageLabel = computed(() =>
    usage.value.usedBytes === null || usage.value.quotaBytes === null
        ? t('home.storage.unavailable')
        : t('home.storage.usage', { used: formatBytes(usage.value.usedBytes), quota: formatBytes(usage.value.quotaBytes) }),
)

const { isRelativeAccount } = useSession()
const isConfirmingAll = ref(false)
const backPath = computed<string>(() => (isRelativeAccount.value ? '/relative' : '/family'))

const confirmRemoveAll = async (): Promise<void> => {
    isConfirmingAll.value = false
    await removeAll()
}

const keep = async (): Promise<void> => {
    await requestPersistence()
}

onMounted(refresh)
</script>

<style scoped>
.storage__card {
    padding: 16px;
    border: var(--outline) solid var(--ink);
    border-radius: 22px;
    background: var(--paper);
    box-shadow: var(--shadow);
}

.storage__hint {
    margin: 0;
    color: var(--ink-soft);
    font: 600 1rem/1.3 var(--font-body);
}

.storage__list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin: 0;
    padding: 0;
    list-style: none;
}

.storage__icon {
    display: flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border: var(--outline) solid var(--ink);
    border-radius: 50%;
    background: var(--mint-soft);
    color: var(--on-accent);
}
</style>
