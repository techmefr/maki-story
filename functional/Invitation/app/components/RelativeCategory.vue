<template>
    <div class="stack category">
        <BackLink to="/home" />
        <div class="row">
            <h1 class="title grow">{{ t(`category.${slug}`) }}</h1>
            <AppBadge>{{ tasks.length }}</AppBadge>
        </div>
        <p v-if="loadError" class="error" role="alert">{{ loadError }}</p>
        <AppEmpty v-if="isLoaded && tasks.length === 0" :title="t('category.emptyTitle')" :hint="t('category.emptyHint')" />
        <RelativeTaskList :tasks="tasks" :kind="slug" />
    </div>
</template>

<script setup lang="ts">
const { slug } = defineProps<{ slug: 'toRecord' | 'proposals' | 'toFix' }>()
const { t } = useI18n()
const { isLoaded, load } = useRelativeFlow()
const { recordingTasks, proposedTasks, correctionTasks } = useRelativeTasks()
const loadError = ref('')
const tasks = computed(() => slug === 'toRecord' ? recordingTasks.value : slug === 'proposals' ? proposedTasks.value : correctionTasks.value)

onMounted(async () => {
    try {
        await load()
    } catch (error) {
        console.error('Impossible de charger la catégorie', error)
        loadError.value = t('relative.loadFailed')
    }
})
</script>

<style scoped>
.category {
    gap: 24px;
}
</style>
