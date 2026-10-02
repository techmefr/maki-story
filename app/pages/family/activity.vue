<template>
    <div class="stack narrow">
        <NuxtLink to="/family" class="link-back"><AppIcon name="back" :size="18" class="mirror-rtl" />{{ t('common.back') }}</NuxtLink>
        <h1 class="title">{{ t('recovery.activity.title') }}</h1>
        <p class="muted">{{ t('recovery.activity.intro', { months: JOURNAL_RETENTION_MONTHS }) }}</p>
        <AppEmpty v-if="isLoaded && items.length === 0" :title="t('recovery.activity.empty')" :hint="t('recovery.activity.emptyHint')" />
        <ul class="stack list" :aria-busy="!isLoaded">
            <li v-for="item in items" :key="item.id" class="card stack" style="gap: 4px" data-activity>
                <div class="subtitle">{{ labelOf(item) }}</div>
                <div class="muted">
                    {{ item.actorName ? t('recovery.activity.by', { name: item.actorName }) : t('recovery.activity.system') }} · {{ formatDateTime(item.createdAt) }}
                </div>
                <span v-if="item.outcome !== 'SUCCESS'" class="badge">{{ t(`recovery.activity.outcome.${item.outcome.toLowerCase()}`) }}</span>
            </li>
        </ul>
        <AppButton variant="secondary" is-block v-if="items.length < total" :disabled="isBusy" @click="more">
            <AppIcon name="chevron-down" :size="18" />{{ t('recovery.activity.more') }}
        </AppButton>
        <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
    </div>
</template>

<script setup lang="ts">
import { ACTIVITY_PAGE_LIMIT, JOURNAL_RETENTION_MONTHS } from '../../../shared/utils/retention'

const { t, formatDateTime } = useI18n()
const { request } = useApi()

const items = ref<IActivityEntry[]>([])
const total = ref(0)
const isLoaded = ref(false)
const isBusy = ref(false)
const errorMessage = ref('')

const labelOf = (item: IActivityEntry): string => {
    const key = `recovery.activity.actions.${item.action}`
    const label = t(key)
    return label === key ? item.action : label
}

const fetchPage = async (offset: number): Promise<void> => {
    isBusy.value = true
    try {
        const page = await request<IActivityPage>(`/family/activity?limit=${ACTIVITY_PAGE_LIMIT}&offset=${offset}`)
        items.value = offset === 0 ? page.items : [...items.value, ...page.items]
        total.value = page.total
    } catch (_error) {
        errorMessage.value = t('recovery.activity.error')
    } finally {
        isBusy.value = false
        isLoaded.value = true
    }
}

const more = (): Promise<void> => fetchPage(items.value.length)

onMounted(() => fetchPage(0))
</script>

<style scoped>
.list {
    list-style: none;
    padding: 0;
    margin: 0;
}
</style>
