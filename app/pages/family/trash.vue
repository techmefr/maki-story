<template>
    <div class="stack narrow">
        <NuxtLink to="/family" class="link-back"><AppIcon name="back" :size="18" class="mirror-rtl" />{{ t('common.back') }}</NuxtLink>
        <h1 class="title">{{ t('recovery.trash.title') }}</h1>
        <p class="muted">{{ t('recovery.trash.intro', { days: RESTORE_WINDOW_DAYS }) }}</p>
        <AppEmpty v-if="isLoaded && items.length === 0" :title="t('recovery.trash.empty')" :hint="t('recovery.trash.emptyHint')" />
        <ul class="stack list" :aria-busy="!isLoaded">
            <li v-for="item in items" :key="keyOf(item)" class="card row" :data-trash="item.type">
                <div class="grow">
                    <div class="subtitle">{{ labelOf(item) }}</div>
                    <div class="muted">{{ detailOf(item) }}</div>
                    <div class="muted">{{ t('recovery.trash.until', { date: formatDate(item.restoreUntil) }) }}</div>
                </div>
                <button type="button" class="btn btn--mint btn--small" :disabled="busyKey === keyOf(item)" :aria-label="t('recovery.trash.restoreLabel', { label: labelOf(item) })" @click="restore(item)">
                    <AppIcon name="redo" :size="18" />{{ t('recovery.trash.restore') }}
                </button>
            </li>
        </ul>
        <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
    </div>
</template>

<script setup lang="ts">
import { RESTORE_WINDOW_DAYS } from '../../../shared/utils/retention'

const { t, formatDate } = useI18n()
const { request } = useApi()

const items = ref<ITrashItem[]>([])
const isLoaded = ref(false)
const busyKey = ref('')
const errorMessage = ref('')

const keyOf = (item: ITrashItem): string => `${item.type}:${item.id}`
const labelOf = (item: ITrashItem): string => {
    if (item.type === 'message') {
        return t('recovery.trash.messageLabel', { from: item.label, to: item.detail })
    }
    return item.label || t(`recovery.trash.types.${item.type}`)
}
const detailOf = (item: ITrashItem): string => {
    if (item.type === 'recordings') {
        return t('recovery.trash.recordingsCount', { count: item.count })
    }
    return t(`recovery.trash.types.${item.type}`)
}

const load = async (): Promise<void> => {
    try {
        items.value = await request<ITrashItem[]>('/trash')
    } catch (_error) {
        errorMessage.value = t('recovery.trash.error')
    } finally {
        isLoaded.value = true
    }
}

const restore = async (item: ITrashItem): Promise<void> => {
    busyKey.value = keyOf(item)
    errorMessage.value = ''
    try {
        await request('/trash/restore', { method: 'POST', body: { type: item.type, id: item.id } })
        await load()
    } catch (error) {
        const status = (error as { statusCode?: number }).statusCode
        errorMessage.value = status === 409 ? t('recovery.trash.conflict') : t('recovery.trash.error')
    } finally {
        busyKey.value = ''
    }
}

onMounted(load)
</script>

<style scoped>
.list {
    list-style: none;
    padding: 0;
    margin: 0;
}
</style>
