<template>
    <div class="stack category">
        <BackLink to="/relative" />
        <div class="row">
            <h1 class="title grow">{{ t(`category.${slug}`) }}</h1>
            <AppBadge>{{ rows.length }}</AppBadge>
        </div>
        <AppEmpty v-if="isLoaded && rows.length === 0" :title="t('category.emptyTitle')" :hint="t('category.emptyHint')" />
        <ul class="category__list">
            <li v-for="row in rows" :key="row.key" data-testid="category-row">
                <AppListRow :title="row.title" :subtitle="row.subtitle" :to="row.to">
                    <template #lead><span class="category__dot" :style="{ background: pickVoiceByText(row.key).hex }" aria-hidden="true" /></template>
                    <template v-if="row.chip" #action><AppBadge :tone="row.tone">{{ row.chip }}</AppBadge></template>
                </AppListRow>
            </li>
        </ul>
    </div>
</template>

<script setup lang="ts">
interface ICategoryRow {
    key: string
    title: string
    subtitle: string
    to: string
    chip: string
    tone: 'success' | 'warning' | 'danger' | 'info' | undefined
}

const { slug } = defineProps<{ slug: 'toRecord' | 'proposals' | 'toFix' }>()

const { t } = useI18n()
const { flow, isLoaded, load } = useRelativeFlow()

const rows = computed<ICategoryRow[]>(() =>
    flow.value.families.flatMap(family => {
        if (slug === 'toRecord') {
            return family.requests.map(request => ({
                key: `${request.kind}-${request.bookId}-${request.shareId ?? ''}`,
                title: request.bookTitle,
                subtitle: t('relative.requestMeta', { count: request.lineCount, family: family.familyName }),
                to: request.kind === 'share' && request.shareId ? `/sharing/${request.shareId}` : `/books/${request.bookId}/studio`,
                chip: t('category.record'),
                tone: 'success' as const,
            }))
        }
        if (slug === 'proposals') {
            return family.proposals.map(proposal => ({
                key: proposal.shareId,
                title: proposal.bookTitle,
                subtitle: t('relative.cardFamily', { family: family.familyName }),
                to: `/sharing/${proposal.shareId}`,
                chip: t(`relative.proposalStatus.${proposal.status}`),
                tone: undefined,
            }))
        }
        return family.fixes.map(fix => ({
            key: fix.bookId,
            title: fix.bookTitle,
            subtitle: fix.comment ? `${fix.authorName ? `${fix.authorName} : ` : ''}« ${fix.comment} » · ${t('relative.fixTakes', { count: fix.takeCount })}` : t('relative.fixTakes', { count: fix.takeCount }),
            to: `/books/${fix.bookId}/studio`,
            chip: t('category.redo'),
            tone: 'warning' as const,
        }))
    }),
)

onMounted(load)
</script>

<style scoped>
.category__list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin: 0;
    padding: 0;
    list-style: none;
}

.category__dot {
    flex: none;
    width: 40px;
    height: 40px;
    border: var(--outline) solid var(--ink);
    border-radius: 50%;
}
</style>
