<template>
    <div class="stack narrow">
        <NuxtLink :to="`/books/${bookId}/review`" class="muted">{{ t('review.activityPage.back') }}</NuxtLink>
        <h1 class="title">{{ t('review.activity') }}</h1>
        <p v-if="!isLoaded" class="muted">{{ t('common.loading') }}</p>
        <template v-else>
            <p class="subtitle" data-testid="activity-summary">{{ summary }}</p>
            <section v-if="freshItems.length > 0" class="stack" aria-labelledby="activity-new">
                <h2 id="activity-new" class="label">{{ t('review.activityPage.fresh') }}</h2>
                <ul class="activity">
                    <li v-for="item in freshItems" :key="item.id" class="card activity__item" data-activity="new">
                        <AppIcon :name="iconOf(item.kind)" :size="22" />
                        <div class="grow">
                            <div>{{ sentence(item) }}</div>
                            <div v-if="item.body" class="activity__body">« {{ item.body }} »</div>
                            <div class="muted">{{ formatWhen(item.createdAt) }}</div>
                        </div>
                    </li>
                </ul>
            </section>
            <section v-if="olderItems.length > 0" class="stack" aria-labelledby="activity-old">
                <h2 id="activity-old" class="label">{{ t('review.activityPage.history') }}</h2>
                <ul class="activity">
                    <li v-for="item in olderItems" :key="item.id" class="card activity__item" data-activity="old">
                        <AppIcon :name="iconOf(item.kind)" :size="22" />
                        <div class="grow">
                            <div>{{ sentence(item) }}</div>
                            <div v-if="item.body" class="activity__body">« {{ item.body }} »</div>
                            <div class="muted">{{ formatWhen(item.createdAt) }}</div>
                        </div>
                    </li>
                </ul>
            </section>
            <p v-if="activity && activity.items.length === 0" class="muted">{{ t('review.activityPage.empty') }}</p>
        </template>
    </div>
</template>

<script setup lang="ts">
const ICONS: Record<ActivityKind, IconName> = {
    submitted: 'send',
    resubmitted: 'redo',
    approved: 'check',
    changes_requested: 'message',
    validated: 'rocket',
    stale: 'pencil',
    voice_added: 'sparkles',
}

const { t, formatDateTime } = useI18n()
const route = useRoute()
const { loadActivity, markSeen } = useReview()
const { getById, ensureLoaded } = useMembers()
const { current } = useCurrentMember()

const bookId = String(route.params.id)
const activity = ref<IBookActivity | null>(null)
const isLoaded = ref(false)

const freshItems = computed(() => (activity.value?.items ?? []).filter(item => item.isNew))
const olderItems = computed(() => (activity.value?.items ?? []).filter(item => !item.isNew))
const summary = computed(() => {
    const count = activity.value?.newCount ?? 0
    return count === 0 ? t('review.activityPage.noNews') : t('review.activityPage.news', { count })
})

const nameOf = (id: string | null): string => getById(id)?.name ?? t('review.activityPage.someone')
const iconOf = (kind: ActivityKind): IconName => ICONS[kind]
const formatWhen = (value: string): string => formatDateTime(value)

const sentence = (item: IActivityItem): string => {
    const actor = nameOf(item.actorMemberId)
    const subject = nameOf(item.subjectMemberId)
    const params = { actor, name: subject, count: item.count }
    const keys: Record<ActivityKind, string> = {
        submitted: 'submitted',
        resubmitted: 'resubmitted',
        approved: 'approved',
        changes_requested: 'changesRequested',
        validated: 'validated',
        stale: 'stale',
        voice_added: 'voiceAdded',
    }
    return t(`review.activityPage.sentence.${keys[item.kind]}`, item.kind === 'validated' ? { ...params, name: actor } : params)
}

onMounted(async () => {
    if (current.value?.role === 'relative') {
        await navigateTo('/library')
        return
    }
    try {
        await ensureLoaded()
        activity.value = await loadActivity(bookId)
        isLoaded.value = true
        await markSeen(bookId)
    } catch (error) {
        console.error('L activité n a pas pu être chargée', error)
        await navigateTo('/library')
    }
})
</script>

<style scoped>
.activity {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 10px;
}

.activity__item {
    display: flex;
    gap: 12px;
    align-items: flex-start;
}

.activity__body {
    font-weight: 700;
    overflow-wrap: anywhere;
}
</style>
