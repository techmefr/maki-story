<template>
    <div v-if="isForbidden" class="stack narrow">
        <BackLink to="/library" />
        <AppEmpty kind="library" :title="t('review.parentOnly')" :hint="t('review.parentOnlyHint')" />
    </div>
    <div class="stack narrow review" v-else-if="book">
        <BackLink to="/library">{{ t('review.back') }}</BackLink>
        <h1 class="title">{{ t('review.title', { title: book.title }) }}</h1>
        <div class="row row--wrap">
            <span class="badge" data-testid="book-status">{{ t(`review.bookStatus.${book.status}`) }}</span>
        </div>
        <AppStepper :steps="flowSteps" :current="flowSteps.length - 1" :label="t('review.flow.label')" />
        <p class="review__counter" data-testid="review-counter">{{ t('review.toListen', { count: toListenCount }) }}</p>
        <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
                <section class="stack review__summary" aria-labelledby="review-summary" data-testid="review-summary">
                    <h2 id="review-summary" class="sr-only">{{ t('review.summary.title') }}</h2>
                    <div class="row row--wrap">
                        <AppBadge tone="success">{{ t('review.summary.approved', { count: countOf('approved') }) }}</AppBadge>
                        <AppBadge tone="danger">{{ t('review.summary.changes', { count: countOf('changes') }) }}</AppBadge>
                        <AppBadge tone="warning">{{ t('review.summary.waiting', { count: waitingCount }) }}</AppBadge>
                    </div>
                    <AppProgress :value="approvedPercent" :label="t('review.summary.title')" />
                </section>
        <div class="review__pages">
            <details v-for="page in reviewPages" :key="page.index" class="review__page" open>
                <summary class="review__page-head">
                    <span class="review__page-cover"><BookCover :file-id="page.fileId" :fallback="pickVoiceByText(`${book.id}-${page.index}`).hex" /></span>
                    <span class="grow"><span class="review__page-number">{{ t('kid.listen.page', { current: page.index + 1, total: Math.max(1, book.pages.length) }) }}</span><strong>{{ page.title }}</strong></span>
                    <AppBadge>{{ page.lines.length }}</AppBadge><AppIcon name="chevron-down" :size="24" />
                </summary>
                <ol class="review__lines">
            <li v-for="line in page.lines" :key="line.id" class="card stack review__line" :data-line-state="stateOf(line)">
                <div class="row row--wrap">
                    <AppAvatar :member="memberOf(line)" :size="36" />
                    <span class="label">{{ t('review.lineMeta', { page: line.pageIndex + 1, character: line.character || t('review.narrator'), voice: memberOf(line)?.name ?? t('review.voice') }) }}</span>
                    <span class="badge review__state" :class="`review__state--${stateOf(line)}`">{{ t(`review.state.${stateOf(line)}`) }}</span>
                </div>
                <p v-if="hasDiff(line)" class="review__diff" data-testid="review-line-diff">
                    <del class="review__old">{{ line.previousText }}</del>
                    <ins class="review__new">{{ line.text }}</ins>
                </p>
                <p v-else class="review__text" data-testid="review-line-text">{{ textOf(line) }}</p>
                <LineReadAloud :line-id="line.id" :text="textOf(line)" :language="language" />
                <p v-if="isOriginalShown && language !== book.language" class="review__original muted" data-testid="review-original-text">{{ t('reviewLanguage.original') }} {{ line.text }}</p>
                <ul v-if="commentsOf(line).length > 0" class="review__thread" :aria-label="t('review.comments')">
                    <li v-for="comment in commentsOf(line)" :key="comment.id" :class="{ 'review__comment--done': comment.resolvedAt !== null }">
                        <strong>{{ authorName(comment) }}</strong> · {{ formatWhen(comment.createdAt) }}
                        <span v-if="comment.resolvedAt !== null" class="badge">{{ t('review.resolved') }}</span>
                        <div>{{ comment.body }}</div>
                    </li>
                </ul>
                <div class="row row--wrap">
                    <AppButton variant="secondary"
                        class="review__action"
                        :disabled="!hasTake(line)"
                        :aria-label="t('review.playAria', { page: line.pageIndex + 1 })"
                        @click="play(line)">
                        <AppIcon :name="playingLineId === line.id && player.isPlaying.value ? 'stop' : 'play'" :size="20" />{{ t('review.play') }}
                    </AppButton>
                    <template>
                        <AppButton variant="secondary" tone="mint"
                            v-if="canReview(line) && stateOf(line) !== 'approved'"
                            class="review__action"
                            :disabled="isBusy"
                            :aria-label="t('review.approveAria', { page: line.pageIndex + 1 })"
                            @click="approve(line)">
                            <AppIcon name="check" :size="20" />{{ t('review.approve') }}
                        </AppButton>
                        <AppButton variant="destructive"
                            v-if="canReview(line)"
                            class="review__action"
                            :disabled="isBusy"
                            :aria-label="t('review.redoAria', { page: line.pageIndex + 1 })"
                            @click="openRedo(line.id)">
                            <AppIcon name="redo" :size="20" />{{ t('review.filters.redo') }}
                        </AppButton>
                    </template>
                </div>
            </li>
                </ol>
            </details>
        </div>
        <p v-if="shownLines.length === 0" class="muted">{{ t('review.emptyFilter') }}</p>
        <section class="stack">
            <AppButton variant="secondary" size="sm" class="review__action" :aria-expanded="isMoreOpen" aria-controls="review-more" data-testid="review-more-toggle" @click="isMoreOpen = !isMoreOpen">
                <AppIcon name="chevron-down" :size="18" class="review__chevron" :class="{ 'review__chevron--open': isMoreOpen }" />{{ t('review.more') }}
            </AppButton>
            <div v-show="isMoreOpen" id="review-more" class="stack">
                <AppButton variant="secondary" size="sm" :to="`/books/${bookId}/activity`">
                    <AppIcon name="sparkles" :size="16" />{{ t('review.activity') }}
                </AppButton>
                <div v-if="languages.length > 1" class="row row--wrap" role="group" :aria-label="t('reviewLanguage.label')" data-testid="review-languages">
                    <button
                        v-for="code in languages"
                        :key="code"
                        type="button"
                        class="chip review__chip"
                        :class="{ 'chip--on': language === code }"
                        :aria-pressed="language === code"
                        :data-testid="`review-language-${code}`"
                        @click="language = code"
                    >
                        {{ languageLabel(code) }}
                    </button>
                </div>
                <AppButton
                    variant="secondary"
                    size="sm"
                    class="review__action"
                    v-if="language !== book.language"
                    :aria-pressed="isOriginalShown"
                    data-testid="review-original-toggle"
                    @click="isOriginalShown = !isOriginalShown"
                >
                    <AppIcon name="book" :size="18" />{{ isOriginalShown ? t('reviewLanguage.hide') : t('reviewLanguage.show') }}
                </AppButton>
                <div class="row row--wrap" role="group" :aria-label="t('review.filtersLabel')">
                    <button
                        v-for="item in FILTERS"
                        :key="item.id"
                        type="button"
                        class="chip review__chip"
                        :class="{ 'chip--on': filter === item.id }"
                        :aria-pressed="filter === item.id"
                        @click="filter = item.id"
                    >
                        {{ t(`review.filters.${item.id}`) }} ({{ countOf(item.id) }})
                    </button>
                </div>
                <section class="stack" aria-labelledby="review-voices">
                    <h2 id="review-voices" class="subtitle">{{ t('review.voicesTitle') }}</h2>
                    <ul class="review__voices">
                        <li v-for="voice in voices" :key="voice.member.id" class="row" data-testid="voice-progress">
                            <AppAvatar :member="voice.member" :size="32" />
                            <strong>{{ voice.member.name }}</strong>
                            <span class="badge">{{ t('review.voiceProgress', { done: voice.approved, total: voice.total }) }}</span>
                        </li>
                    </ul>
                </section>
            </div>
        </section>
        <form v-if="isRedoOpen" class="stack card" @submit.prevent="sendRedo">
            <span class="label">{{ t('review.redoLine') }}</span>
            <AppSelect v-model="redoLineId" :aria-label="t('review.redoLine')" :options="redoLineOptions" />
            <label class="label" for="redo-comment">{{ t('review.commentLabel') }}</label>
            <textarea id="redo-comment" v-model="draft" class="input" rows="3" maxlength="500" required />
            <div class="row row--wrap">
                <AppButton type="submit" class="review__action" :disabled="isBusy || draft.trim() === '' || redoLineId === ''">
                    <AppIcon name="send" :size="20" />{{ t('review.sendRequest') }}
                </AppButton>
                <AppButton variant="secondary" class="review__action" @click="closeRedo">{{ t('review.cancel') }}</AppButton>
            </div>
        </form>
        <div class="review__bar">
            <p v-if="!canValidate && book.status !== 'ready'" class="muted review__hint">{{ validateHint }}</p>
            <AppButton variant="secondary" tone="mint" is-block class="review__validate" :disabled="!canValidate || isBusy" @click="validateAll">
                <AppIcon name="rocket" :size="22" />{{ t('review.validateAll') }}
            </AppButton>
            <AppButton variant="destructive" is-block class="review__validate" :disabled="redoLines.length === 0 || isBusy" :aria-expanded="isRedoOpen" @click="toggleRedo">
                <AppIcon name="redo" :size="22" />{{ t('review.askRedo') }}
            </AppButton>
        </div>
    </div>
    <p v-else class="muted">{{ t('common.loading') }}</p>
</template>

<script setup lang="ts">
type FilterId = 'all' | 'to_review' | 'changes' | 'approved'

const FILTERS: { id: FilterId }[] = [{ id: 'all' }, { id: 'to_review' }, { id: 'changes' }, { id: 'approved' }]

const { t, formatDateTime } = useI18n()
const reviewPages = computed(() => [...new Set(shownLines.value.map(line => line.pageIndex))].sort((a, b) => a - b).map(index => {
    const page = book.value?.pages.find(item => item.position === index)
    return { index, title: page?.title ?? '', fileId: page?.fileId ?? null, lines: shownLines.value.filter(line => line.pageIndex === index) }
}))

const route = useRoute()
const { get } = useBooks()
const { getById, ensureLoaded } = useMembers()
const { reviewLine, validateAll: validateBook, loadComments } = useReview()
const { current } = useCurrentMember()
const player = useAudioPlayer()

const bookId = String(route.params.id)
const book = ref<IBook | null>(null)
const comments = ref<IReviewComment[]>([])
const filter = ref<FilterId>('all')
const draft = ref('')
const isBusy = ref(false)
const isMoreOpen = ref(false)
const errorMessage = ref('')
const playingLineId = ref<string | null>(null)

const language = ref('')
const isOriginalShown = ref(false)

const languages = computed(() => {
    if (!book.value) {
        return []
    }
    const codes = new Set<string>([book.value.language, ...book.value.voiceLanguages, ...book.value.recordings.map(item => item.language)])
    return [...codes]
})

const recordingIn = (line: ILine, code: string): ILineRecording | null => {
    return book.value?.recordings.find(item => item.lineId === line.id && item.language === code) ?? null
}

const recordingOf = (line: ILine): ILineRecording | null => recordingIn(line, language.value)

const textOf = (line: ILine): string => {
    if (language.value === book.value?.language) {
        return line.text
    }
    return book.value?.translations.find(item => item.lineId === line.id && item.language === language.value)?.text ?? line.text
}

const stateOf = (line: ILine): ReviewLineState => reviewStateOf(recordingOf(line)?.status ?? null)
const gateStateOf = (line: ILine): ReviewLineState => reviewStateOf(recordingIn(line, book.value?.language ?? '')?.status ?? null)
const hasTake = (line: ILine): boolean => recordingOf(line) !== null
const canReview = (line: ILine): boolean => ['to_review', 'changes', 'approved'].includes(stateOf(line))
const memberOf = (line: ILine): IMember | null => getById(line.memberId)
const commentsOf = (line: ILine): IReviewComment[] => comments.value.filter(item => item.lineId === line.id)
const authorName = (comment: IReviewComment): string => getById(comment.authorMemberId)?.name ?? t('review.parent')

const hasDiff = (line: ILine): boolean => line.previousText !== null && line.previousText !== line.text && stateOf(line) !== 'approved' && language.value === book.value?.language

const matches = (line: ILine, id: FilterId): boolean => {
    const state = stateOf(line)
    if (id === 'all') {
        return true
    }
    return id === 'changes' ? state === 'changes' || state === 'stale' : state === id
}

const waitingCount = computed<number>(() => Math.max(0, (book.value?.lines.length ?? 0) - countOf('approved') - countOf('changes')))
const approvedPercent = computed<number>(() => {
    const total = book.value?.lines.length ?? 0
    return total === 0 ? 0 : Math.round((countOf('approved') / total) * 100)
})
const toListenCount = computed<number>(() => (book.value?.lines ?? []).filter(line => stateOf(line) === 'to_review').length)
const flowSteps = computed(() => ['create', 'record', 'send', 'validate'].map(id => ({ id, label: t(`review.flow.${id}`) })))
const countOf = (id: FilterId): number => (book.value?.lines ?? []).filter(line => matches(line, id)).length
const shownLines = computed(() => (book.value?.lines ?? []).filter(line => matches(line, filter.value)))

const voices = computed(() => {
    const lines = book.value?.lines ?? []
    const ids = [...new Set(lines.map(line => line.memberId).filter((id): id is string => id !== null))]
    return ids
        .map(id => ({ member: getById(id), own: lines.filter(line => line.memberId === id) }))
        .filter((voice): voice is { member: IMember; own: ILine[] } => voice.member !== null)
        .map(voice => ({
            member: voice.member,
            total: voice.own.length,
            approved: voice.own.filter(line => stateOf(line) === 'approved').length,
        }))
})

const canValidate = computed(() => {
    const lines = book.value?.lines ?? []
    return lines.length > 0 && lines.every(line => ['to_review', 'approved'].includes(gateStateOf(line))) && lines.some(line => gateStateOf(line) !== 'approved')
})

const validateHint = computed(() => {
    const lines = book.value?.lines ?? []
    if (lines.some(line => gateStateOf(line) === 'changes' || gateStateOf(line) === 'stale')) {
        return t('review.validateHint.redo')
    }
    if (lines.some(line => gateStateOf(line) === 'missing')) {
        return t('review.validateHint.missing')
    }
    return t('review.validateHint.done')
})

const formatWhen = (value: string): string => formatDateTime(value)

const refresh = async (): Promise<void> => {
    const [loadedBook, loadedComments] = await Promise.all([get(bookId), loadComments(bookId)])
    book.value = loadedBook
    comments.value = loadedComments
    if (language.value === '') {
        language.value = loadedBook.language
    }
}

const run = async (action: () => Promise<void>): Promise<void> => {
    isBusy.value = true
    errorMessage.value = ''
    try {
        await action()
        await refresh()
    } catch (error) {
        console.error('La relecture n a pas pu être enregistrée', error)
        errorMessage.value = t('review.errorSave')
    } finally {
        isBusy.value = false
    }
}

const play = async (line: ILine): Promise<void> => {
    const recording = recordingOf(line)
    if (!recording) {
        return
    }
    if (playingLineId.value === line.id && player.isPlaying.value) {
        player.stop()
        return
    }
    playingLineId.value = line.id
    await player.play(recording.fileId)
}

const approve = (line: ILine): Promise<void> => run(async () => void (await reviewLine(bookId, line.id, { action: 'approve', language: language.value })))


const isRedoOpen = ref(false)
const redoLineId = ref('')
const redoLineOptions = computed(() => redoLines.value.map(line => ({ value: line.id, label: redoOptionLabel(line) })))
const redoLines = computed(() => (book.value?.lines ?? []).filter(line => canReview(line)))
const redoOptionLabel = (line: ILine): string => `${t('review.lineMeta', { page: line.pageIndex + 1, character: line.character || t('review.narrator'), voice: memberOf(line)?.name ?? t('review.voice') })} - ${textOf(line)}`

const openRedo = (lineId: string): void => {
    draft.value = ''
    redoLineId.value = lineId
    isRedoOpen.value = true
}

const closeRedo = (): void => {
    isRedoOpen.value = false
    draft.value = ''
}

const toggleRedo = (): void => {
    if (isRedoOpen.value) {
        closeRedo()
        return
    }
    openRedo(redoLines.value[0]?.id ?? '')
}

const sendRedo = (): Promise<void> =>
    run(async () => {
        await reviewLine(bookId, redoLineId.value, { action: 'request_changes', comment: draft.value, language: language.value })
        closeRedo()
    })

const validateAll = (): Promise<void> => run(async () => void (await validateBook(bookId)))

const isForbidden = ref(false)

onBeforeUnmount(() => player.stop())

onMounted(async () => {
    try {
        await ensureLoaded()
        if (current.value?.role !== 'parent') {
            isForbidden.value = true
            return
        }
        await refresh()
    } catch (error) {
        console.error('Le livre n a pas pu être chargé', error)
        await navigateTo('/library')
    }
})
</script>

<style scoped>
.review__summary {
    padding: 20px;
    border: var(--outline) solid var(--ink);
    border-radius: 24px;
    background: var(--paper);
    box-shadow: var(--shadow);
}

.review__pages {
    display: grid;
    gap: 24px;
}

.review__page {
    border: var(--outline) solid var(--ink);
    border-radius: 28px;
    background: var(--paper);
    box-shadow: var(--shadow-lg);
    overflow: clip;
}

.review__page-head {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    background: var(--bg);
    cursor: pointer;
    min-height: 72px;
    list-style: none;
}

.review__page-head::-webkit-details-marker {
    display: none;
}

.review__page-head .grow {
    display: grid;
    gap: 8px;
    overflow-wrap: anywhere;
}

.review__page-number {
    color: var(--ink-soft);
    font-size: 0.9375rem;
}

.review__page-cover {
    width: 48px;
    flex: none;
}

.review__page[open] .review__page-head {
    border-bottom: var(--outline) solid var(--ink);
}

.review__page .review__line {
    border: 0;
    border-bottom: 2px solid var(--grey-line);
    border-radius: 0;
    box-shadow: none;
}

.review__page .review__line:last-child {
    border-bottom: 0;
}

.review__page .review__lines {
    gap: 0;
}

.review {
    gap: 24px;
}

.review .review__lines {
    gap: 20px;
}

.review .review__counter {
    padding: 16px 20px;
    border: var(--outline) solid var(--ink);
    border-radius: 20px;
    background: var(--sky);
    color: var(--on-accent);
}

.review .review__bar {
    bottom: calc(76px + env(safe-area-inset-bottom));
    gap: 12px;
    padding: 16px;
    border: var(--outline) solid var(--ink);
    border-radius: 24px;
    background: var(--paper);
    box-shadow: var(--shadow);
}

@media (min-width: 1024px) {
    .review {
        max-width: 960px;
    }

    .review .review__bar {
        bottom: 16px;
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .review__bar .review__hint {
        grid-column: 1 / -1;
    }
}

.review__chevron {
    flex: none;
    transition: rotate 0.2s;
}

.review__chevron--open {
    rotate: 180deg;
}

@media (prefers-reduced-motion: reduce) {
    .review__chevron {
        transition: none;
    }
}
.review__diff {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin: 0;
}

.review__old {
    color: var(--danger);
    text-decoration-thickness: 2px;
}

.review__new {
    padding: 2px 6px;
    border-radius: 8px;
    background: var(--mint-soft);
    color: var(--on-accent);
    text-decoration: none;
}
.review__voices,
.review__lines,
.review__thread {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 10px;
}

.review__voices li {
    flex-wrap: wrap;
}

.review__text {
    margin: 0;
    font: 700 19px/1.4 var(--font-body);
    overflow-wrap: anywhere;
}

.review__original {
    margin: 0;
    overflow-wrap: anywhere;
}

.review__action {
    min-height: 52px;
    min-width: 52px;
}

.review__validate {
    min-height: 60px;
}

.review__counter {
    margin: 0;
    font: 700 1.25rem/1.3 var(--font-title);
}

.review__bar {
    position: sticky;
    bottom: 0;
    display: grid;
    gap: 10px;
    padding: 12px 0;
    background: var(--bg);
}

.review__hint {
    margin: 0;
}

.review__chip {
    min-height: 44px;
}

.review__state--approved {
    background: var(--mint);
    color: var(--on-accent);
}

.review__state--changes,
.review__state--stale {
    background: var(--coral);
    color: var(--on-accent);
}

.review__state--to_review {
    background: var(--yellow);
    color: var(--on-accent);
}

.review__thread li {
    border: 2px solid var(--ink);
    border-radius: 12px;
    padding: 8px 10px;
    background: var(--bg);
}

.review__comment--done {
    opacity: 0.65;
}
</style>
