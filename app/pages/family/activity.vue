<template>
    <div class="stack narrow">
        <BackLink to="/family" />
        <h1 class="title">{{ t('recovery.activity.title') }}</h1>
        <p class="activity__hint">{{ t('recovery.activity.intro', { months: JOURNAL_RETENTION_MONTHS }) }}</p>
        <div class="row row--wrap" role="group" :aria-label="t('recovery.activity.person')">
            <AppChip :selected="personId === ''" data-testid="activity-all" @click="choose('')">{{ t('recovery.activity.everyone') }}</AppChip>
            <AppChip v-for="person in people" :key="person.id" :selected="personId === person.id" @click="choose(person.id)">
                <AppAvatar :member="person" :size="24" />{{ person.name }}
            </AppChip>
        </div>
        <AppEmpty v-if="isLoaded && items.length === 0" :title="t('recovery.activity.empty')" :hint="t('recovery.activity.emptyHint')" />
        <section v-for="group in groups" :key="group.day" class="stack" :aria-labelledby="`day-${group.day}`">
            <h2 :id="`day-${group.day}`" class="label">{{ group.label }}</h2>
            <ul class="list" :aria-busy="!isLoaded">
                <li v-for="item in group.items" :key="item.id" data-activity>
                    <AppListRow :title="labelOf(item)" :subtitle="subtitleOf(item)">
                        <template #lead><span class="activity__dot" :style="{ background: colorOf(item) }" aria-hidden="true">{{ initialOf(item) }}</span></template>
                        <template v-if="item.outcome !== 'SUCCESS'" #action>
                            <AppBadge :tone="item.outcome === 'DENIED' ? 'warning' : 'danger'">{{ t(`recovery.activity.outcome.${item.outcome.toLowerCase()}`) }}</AppBadge>
                        </template>
                    </AppListRow>
                </li>
            </ul>
        </section>
        <AppButton v-if="items.length < total" variant="secondary" is-block icon="chevron-down" :disabled="isBusy" @click="more">{{ t('recovery.activity.more') }}</AppButton>
        <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
    </div>
</template>

<script setup lang="ts">
import { ACTIVITY_PAGE_LIMIT, JOURNAL_RETENTION_MONTHS } from '../../../shared/utils/retention'

const { t, formatDate } = useI18n()
const { request } = useApi()
const { people, ensureLoaded } = useMembers()

const personId = ref('')
const DAY_MS = 86400000
const dayKey = (iso: string): string => iso.slice(0, 10)

const labelOfDay = (day: string, today: string, yesterday: string): string => {
    if (day === today) {
        return t('recovery.activity.today')
    }
    return day === yesterday ? t('recovery.activity.yesterday') : formatDate(day, { dateStyle: 'long' })
}

const groups = computed(() => {
    const byDay = new Map<string, IActivityEntry[]>()
    for (const item of items.value) {
        byDay.set(dayKey(item.createdAt), [...(byDay.get(dayKey(item.createdAt)) ?? []), item])
    }
    const today = dayKey(new Date().toISOString())
    const yesterday = dayKey(new Date(Date.now() - DAY_MS).toISOString())
    return [...byDay.entries()].map(([day, entries]) => ({
        day,
        items: entries,
        label: labelOfDay(day, today, yesterday),
    }))
})

const initialOf = (item: IActivityEntry): string => (item.actorName ?? '?').charAt(0).toUpperCase()
const colorOf = (item: IActivityEntry): string => pickVoiceByText(item.actorName ?? 'system').hex
const subtitleOf = (item: IActivityEntry): string => {
    const time = new Intl.DateTimeFormat(undefined, { timeStyle: 'short' }).format(new Date(item.createdAt))
    return `${item.actorName ? t('recovery.activity.by', { name: item.actorName }) : t('recovery.activity.system')} · ${time}`
}

const choose = async (id: string): Promise<void> => {
    personId.value = id
    await fetchPage(0)
}

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
        const page = await request<IActivityPage>(`/family/activity?limit=${ACTIVITY_PAGE_LIMIT}&offset=${offset}${personId.value ? `&actorId=${personId.value}` : ''}`)
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

onMounted(async () => {
    await ensureLoaded()
    await fetchPage(0)
})
</script>

<style scoped>
.list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin: 0;
    padding: 0;
    list-style: none;
}

.activity__hint {
    margin: 0;
    color: var(--ink-soft);
    font: 600 1rem/1.3 var(--font-body);
}

.activity__dot {
    display: flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border: var(--outline) solid var(--ink);
    border-radius: 50%;
    color: var(--on-accent);
    font: 700 1rem/1 var(--font-title);
}
</style>
