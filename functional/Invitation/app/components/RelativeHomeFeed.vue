<template>
    <div class="relative-feed stack">
        <p v-if="navigationError" class="error" role="alert">{{ navigationError }}</p>
        <section v-if="showChildren && children.length > 0" class="stack" :aria-label="t('home.dash.myChildren')">
            <h2 class="subtitle">{{ t('home.dash.myChildren') }}</h2>
            <div class="relative-feed__children">
                <button v-for="child in children" :key="`${child.familyId}-${child.id}`" type="button" class="relative-feed__child" :disabled="isOpening" :data-testid="`relative-child-${child.id}`" @click="openFamily(child.familyId, `/message/${child.id}`)">
                    <span class="relative-feed__initial" :style="{ background: getVoiceColor(child.color).hex }">{{ initialOf(child.name) }}</span>
                    <strong>{{ child.name }}</strong>
                    <span>{{ child.familyName }}</span>
                    <span class="relative-feed__message"><AppIcon name="mic" :size="20" />{{ t('home.dash.message') }}</span>
                </button>
            </div>
        </section>
        <section v-for="section in sections" :key="section.kind" class="stack" :aria-labelledby="`relative-feed-${section.kind}`">
            <NuxtLink :to="`/categories/${section.kind}`" class="relative-feed__heading">
                <h2 :id="`relative-feed-${section.kind}`" class="subtitle grow">{{ t(section.label) }}</h2>
                <AppBadge>{{ section.tasks.length }}</AppBadge><AppIcon name="chevron-right" :size="24" class="mirror-rtl" />
            </NuxtLink>
            <RelativeTaskList v-if="section.tasks.length > 0" :tasks="section.tasks.slice(0, 2)" :kind="section.kind" />
            <p v-else class="muted">{{ t('category.emptyTitle') }}</p>
        </section>
    </div>
</template>

<script setup lang="ts">
const { showChildren = false } = defineProps<{ showChildren?: boolean }>()
const { t } = useI18n()
const { flow } = useRelativeFlow()
const { recordingTasks, proposedTasks, correctionTasks } = useRelativeTasks()
const { isOpening, navigationError, openFamily } = useFamilyNavigation()
const children = computed(() => flow.value.families.flatMap(family => family.children.map(child => ({ ...child, familyId: family.familyId, familyName: family.familyName }))))
const sections = computed(() => [
    { kind: 'toRecord' as const, label: 'relative.requests', tasks: recordingTasks.value },
    { kind: 'proposals' as const, label: 'relative.proposals', tasks: proposedTasks.value },
    { kind: 'toFix' as const, label: 'relative.fixes', tasks: correctionTasks.value },
])
</script>

<style scoped>
.relative-feed {
    gap: 28px;
}

.relative-feed__heading {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 48px;
    color: inherit;
    text-decoration: none;
}

.relative-feed__children {
    display: flex;
    gap: 16px;
    overflow-x: auto;
    padding-bottom: 8px;
}

.relative-feed__child {
    display: flex;
    flex: 0 0 160px;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 16px;
    border: var(--outline) solid var(--ink);
    border-radius: 28px;
    background: var(--paper);
    color: var(--ink);
    box-shadow: var(--shadow);
    font: inherit;
    cursor: pointer;
    overflow-wrap: anywhere;
}

.relative-feed__initial {
    display: grid;
    place-items: center;
    width: 72px;
    height: 72px;
    border: var(--outline) solid var(--line);
    border-radius: 50%;
    color: var(--on-accent);
    font-size: 2rem;
    font-weight: 700;
}

.relative-feed__message {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border: var(--outline) solid var(--ink);
    border-radius: 24px;
    background: var(--yellow);
    color: var(--on-accent);
}
</style>
