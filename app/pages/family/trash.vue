<template>
    <div class="stack narrow">
        <BackLink to="/family" />
        <h1 class="title">{{ t('recovery.trash.title') }}</h1>
        <p class="trash__hint">{{ t('recovery.trash.intro', { days: RESTORE_WINDOW_DAYS }) }}</p>
        <div v-if="types.length > 1" class="row row--wrap" role="group" :aria-label="t('recovery.trash.filter')">
            <AppChip :selected="filter === ''" @click="filter = ''">{{ t('recovery.trash.all') }}</AppChip>
            <AppChip v-for="type in types" :key="type" :selected="filter === type" @click="filter = type">{{ t(`recovery.trash.types.${type}`) }}</AppChip>
        </div>
        <AppEmpty v-if="isLoaded && shown.length === 0" :title="t('recovery.trash.empty')" :hint="t('recovery.trash.emptyHint')" />
        <ul class="trash__list" :aria-busy="!isLoaded">
            <li v-for="item in shown" :key="keyOf(item)" :data-trash="item.type">
                <AppListRow :title="labelOf(item)" :subtitle="`${detailOf(item)} · ${t('recovery.trash.until', { date: formatDate(item.restoreUntil) })}`">
                    <template #lead><span class="trash__icon" :class="{ 'trash__icon--soon': isSoon(item) }"><AppIcon name="trash" :size="22" /></span></template>
                    <template #action>
                        <AppButton variant="secondary" tone="mint" size="sm" icon="redo" :disabled="busyKey === keyOf(item)" :aria-label="t('recovery.trash.restoreLabel', { label: labelOf(item) })" @click="restore(item)">
                            {{ t('recovery.trash.restore') }}
                        </AppButton>
                    </template>
                </AppListRow>
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
const filter = ref('')
const SOON_DAYS = 3
const DAY_MS = 86400000

const types = computed<string[]>(() => [...new Set(items.value.map(item => item.type))])
const shown = computed<ITrashItem[]>(() => items.value.filter(item => filter.value === '' || item.type === filter.value))
const isSoon = (item: ITrashItem): boolean => new Date(item.restoreUntil).getTime() - Date.now() < SOON_DAYS * DAY_MS
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
.trash__hint {
    margin: 0;
    color: var(--ink-soft);
    font: 600 1rem/1.3 var(--font-body);
}

.trash__list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin: 0;
    padding: 0;
    list-style: none;
}

.trash__icon {
    display: flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border: var(--outline) solid var(--ink);
    border-radius: 50%;
    background: var(--grey);
    color: var(--ink);
}

.trash__icon--soon {
    background: var(--danger-soft);
    color: var(--on-accent);
}
</style>
