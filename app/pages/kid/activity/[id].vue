<template>
    <div class="stack">
        <AppButton variant="secondary" is-round to="/kid/library" :aria-label="t('review.back')"><AppIcon name="back" :size="26" /></AppButton>
        <h1 class="title">{{ t('review.kid.title') }}</h1>
        <p v-if="isLoaded && voices.length === 0" class="muted center">{{ t('review.kid.none') }}</p>
        <ul class="voices" data-testid="kid-new-voices">
            <li v-for="voice in voices" :key="voice.id" class="card voices__item">
                <AppAvatar :member="voice.member" :size="72" />
                <AppIcon name="sparkles" :size="32" motion="wiggle" />
                <span class="sr-only">{{ t('review.kid.joined', { name: voice.member?.name ?? t('review.kid.aVoice') }) }}</span>
            </li>
        </ul>
        <AppButton is-block :to="`/kid/listen/${bookId}`" :aria-label="t('review.kid.listen')">
            <AppIcon name="play" :size="26" />
        </AppButton>
    </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'kid' })

const { t } = useI18n()
const route = useRoute()
const { loadActivity, markSeen } = useReview()
const { getById, ensureLoaded } = useMembers()

const bookId = String(route.params.id)
const activity = ref<IBookActivity | null>(null)
const isLoaded = ref(false)

const voices = computed(() =>
    (activity.value?.items ?? [])
        .filter(item => item.isNew)
        .map(item => ({ id: item.id, member: getById(item.subjectMemberId) })),
)

onMounted(async () => {
    try {
        await ensureLoaded()
        activity.value = await loadActivity(bookId)
        isLoaded.value = true
        await markSeen(bookId)
    } catch (error) {
        console.error('Les nouvelles voix n ont pas pu être chargées', error)
        await navigateTo('/kid/library')
    }
})
</script>

<style scoped>
.sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
}

.voices {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 14px;
    justify-content: center;
}

.voices__item {
    display: flex;
    align-items: center;
    gap: 10px;
}
</style>
