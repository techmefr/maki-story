<template>
    <div class="stack detail">
        <BackLink to="/library" />
        <AppEmpty v-if="hasFailed" :title="t('bookDetail.missing')" />
        <template v-else-if="book">
            <header class="row detail__head">
                <div class="detail__cover"><BookCover :file-id="book.coverFileId" :src="book.coverUrl" :fallback="palette.hex" /></div>
                <div class="stack detail__info">
                    <h1 class="title">{{ book.title }}</h1>
                    <p v-if="book.author" class="detail__meta">{{ book.author }}</p>
                    <AppBadge>{{ t(`review.bookStatus.${book.status}`) }}</AppBadge>
                    <p class="detail__meta">{{ t('bookDetail.meta', { pages: book.pages.length, characters: book.characters.length }) }}</p>
                    <FlagIcon :codes="book.voiceLanguages.length > 0 ? book.voiceLanguages : [book.writtenLanguage]" :size="26" />
                </div>
            </header>

            <p v-if="book.description" class="detail__description">{{ book.description }}</p>
            <ul v-if="tagLabels.length > 0" class="row row--wrap detail__tags" :aria-label="t('bookDetail.tags')">
                <li v-for="label in tagLabels" :key="label"><AppBadge>{{ label }}</AppBadge></li>
            </ul>

            <section class="stack detail__card" aria-labelledby="detail-recording">
                <div class="row">
                    <h2 id="detail-recording" class="subtitle grow">{{ t('bookDetail.recording') }}</h2>
                    <span class="detail__count">{{ t('bookDetail.lines', { done: doneCount, total: book.lines.length }) }}</span>
                </div>
                <AppProgress :value="progressPercent" :label="t('bookDetail.recording')" />
                <ul class="detail__voices">
                    <li v-for="voice in voices" :key="voice.key" class="row detail__voice">
                        <AppAvatar v-if="voice.member" :member="voice.member" :size="36" />
                        <span class="detail__voice-name grow">{{ voice.name }}</span>
                        <span class="detail__count">{{ voice.done }}/{{ voice.total }}</span>
                    </li>
                </ul>
            </section>

            <AppButton is-block icon="play" :to="isChild ? `/kid/listen/${book.id}` : `/books/${book.id}/play`" :disabled="book.status !== 'ready'">
                {{ t('bookDetail.read') }}
            </AppButton>
            <div v-if="!isChild" class="detail__actions">
                <AppButton variant="secondary" class="grow" icon="mic" :to="`/books/${book.id}/studio`">{{ t('bookDetail.record') }}</AppButton>
                <AppButton v-if="isParent" variant="secondary" class="grow" icon="check" :to="`/books/${book.id}/review`">{{ t('home.dash.toReview') }}</AppButton>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
const { id } = defineProps<{ id: string }>()

const { t } = useI18n()
const { get } = useBooks()
const { getById, ensureLoaded } = useMembers()
const { isChild, isParent } = useCurrentMember()

const book = ref<IBook | null>(null)
const hasFailed = ref(false)

const palette = computed(() => pickVoiceByText(id))
const doneCount = computed<number>(() => book.value?.lines.filter(line => line.audioFileId !== null).length ?? 0)
const progressPercent = computed<number>(() => (book.value && book.value.lines.length > 0 ? Math.round((doneCount.value / book.value.lines.length) * 100) : 0))

const tagLabels = computed<string[]>(() => {
    const current = book.value
    if (!current) {
        return []
    }
    return [
        ...current.themes.map(theme => t(`bookDraft.book.theme.${theme}`)),
        ...current.moods.map(mood => t(`bookDraft.book.mood.${mood}`)),
    ]
})

const voices = computed(() => {
    const current = book.value
    if (!current) {
        return []
    }
    const byVoice = new Map<string, { key: string; name: string; member: IMember | null; done: number; total: number }>()
    for (const line of current.lines) {
        const key = line.memberId ?? 'none'
        const member = getById(line.memberId)
        const entry = byVoice.get(key) ?? { key, name: member?.name ?? t('bookDetail.noVoice'), member, done: 0, total: 0 }
        entry.total += 1
        entry.done += line.audioFileId !== null ? 1 : 0
        byVoice.set(key, entry)
    }
    return [...byVoice.values()]
})

onMounted(async () => {
    try {
        await ensureLoaded()
        book.value = await get(id)
    } catch (_error) {
        hasFailed.value = true
    }
})
</script>

<style scoped>
.detail {
    max-width: 880px;
    width: 100%;
    margin-inline: auto;
    gap: 24px;
}

.detail__description {
    margin: 0;
    padding: 20px;
    border: var(--outline) solid var(--ink);
    border-radius: 24px;
    background: var(--paper);
    line-height: 1.5;
    white-space: pre-wrap;
}

.detail__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
}

.detail__actions > * {
    flex: 1 1 160px;
}

.detail__head {
    gap: 20px;
    align-items: center;
}

.detail__cover {
    display: flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 112px;
    max-width: 32%;
    box-shadow: var(--shadow-lg);
    border-radius: 16px;
}

.detail__cover :deep(.cover) {
    width: 100%;
}

.detail__info {
    gap: 12px;
    min-width: 0;
}

.detail__meta,
.detail__count {
    margin: 0;
    color: var(--ink-soft);
    font: 700 0.9375rem/1.2 var(--font-body);
}

.detail__tags,
.detail__voices {
    margin: 0;
    padding: 0;
    list-style: none;
}

.detail__card {
    padding: 24px;
    border: var(--outline) solid var(--ink);
    border-radius: 24px;
    background: var(--paper);
    box-shadow: var(--shadow);
}

.detail__voices {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.detail__voice {
    gap: 10px;
}

.detail__voice-name {
    font: 700 1rem/1.2 var(--font-title);
}
</style>
