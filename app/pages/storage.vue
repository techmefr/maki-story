<template>
    <div class="stack narrow">
        <NuxtLink to="/family" class="link-back"><AppIcon name="back" :size="18" class="mirror-rtl" />{{ t('common.back') }}</NuxtLink>
        <h1 class="title">{{ t('home.storage.title') }}</h1>
        <div class="card stack">
            <div class="subtitle">{{ usageLabel }}</div>
            <div class="progress" role="progressbar" :aria-valuenow="usedPercent" aria-valuemin="0" aria-valuemax="100">
                <div class="progress__fill" :style="{ width: `${usedPercent}%` }" />
            </div>
            <div class="muted">{{ t('home.storage.downloaded', { size: formatBytes(totalBytes) }) }}</div>
            <AppButton variant="secondary" size="sm" v-if="!usage.isPersisted" @click="keep">{{ t('home.storage.keep') }}</AppButton>
            <span v-else class="badge" style="background: #4cd4a8">{{ t('home.storage.protected') }}</span>
        </div>
        <AppEmpty kind="offline" v-if="list.length === 0" :title="t('home.storage.emptyTitle')" :hint="t('home.storage.emptyHint')" />
        <div v-for="record in list" :key="record.id" class="card row" data-offline-book>
            <div class="grow">
                <div class="subtitle">{{ record.title }}</div>
                <div class="muted">{{ record.isComplete ? formatBytes(bytesOf(record)) : `${formatBytes(bytesOf(record))} · ${t('home.storage.incomplete')}` }}</div>
            </div>
            <AppButton variant="secondary" size="sm" :aria-label="t('home.storage.removeOne', { title: record.title })" @click="remove(record.id)">
                <AppIcon name="trash" :size="16" />{{ t('common.delete') }}
            </AppButton>
        </div>
        <AppButton variant="secondary" is-block v-if="list.length > 0" @click="removeAll">{{ t('home.storage.removeAll') }}</AppButton>
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

const keep = async (): Promise<void> => {
    await requestPersistence()
}

onMounted(refresh)
</script>
