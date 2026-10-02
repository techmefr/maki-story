<template>
    <div class="stack narrow" v-if="book">
        <NuxtLink to="/library" class="muted">{{ t('review.back') }}</NuxtLink>
        <h1 class="title">{{ t('review.title', { title: book.title }) }}</h1>
        <div class="row row--wrap">
            <span class="badge" data-testid="book-status">{{ t(`review.bookStatus.${book.status}`) }}</span>
            <AppButton variant="secondary" size="sm" :to="`/books/${bookId}/activity`">
                <AppIcon name="sparkles" :size="16" />{{ t('review.activity') }}
            </AppButton>
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
        <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
        <AppButton variant="secondary" tone="mint" is-block class="review__validate" :disabled="!canValidate || isBusy" @click="validateAll">
            <AppIcon name="rocket" :size="22" />{{ t('review.validateAll') }}
        </AppButton>
        <p v-if="!canValidate && book.status !== 'ready'" class="muted">{{ validateHint }}</p>
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
        <div class="row row--wrap" role="group" :aria-label="t('pageView.viewMode')">
            <button type="button" class="chip review__chip" :class="{ 'chip--on': !isPageMode }" :aria-pressed="!isPageMode" @click="isPageMode = false">
                <AppIcon name="check" :size="18" />{{ t('pageView.byLine') }}
            </button>
            <button type="button" class="chip review__chip" :class="{ 'chip--on': isPageMode }" :aria-pressed="isPageMode" data-testid="review-page-mode" @click="isPageMode = true">
                <AppIcon name="book" :size="18" />{{ t('pageView.byPage') }}
            </button>
        </div>
        <BookPageView
            v-if="isPageMode && pageView"
            :view="pageView"
            mode="review"
            :page-number="pageIndex + 1"
            :page-count="Math.max(1, book.pages.length)"
            :language="language"
            @go="goPage"
        >
            <template #line-actions="{ line }">
                <div class="row row--wrap">
                    <span class="badge review__state" :class="`review__state--${stateOfId(line.id)}`">{{ t(`review.state.${stateOfId(line.id)}`) }}</span>
                    <AppButton variant="secondary" size="sm" class="review__action" :disabled="!hasTakeId(line.id)" @click="playId(line.id)">
                        <AppIcon name="play" :size="18" />{{ t('review.play') }}
                    </AppButton>
                    <AppButton variant="secondary" tone="mint" size="sm"
                        v-if="canReviewId(line.id) && stateOfId(line.id) !== 'approved'"
                        class="review__action"
                        :disabled="isBusy"
                        :data-testid="`page-approve-${line.id}`"
                        @click="approveId(line.id)">
                        <AppIcon name="check" :size="18" />{{ t('review.approve') }}
                    </AppButton>
                    <AppButton variant="destructive" size="sm" v-if="canReviewId(line.id)" class="review__action" :disabled="isBusy" :aria-expanded="openCommentId === line.id" @click="toggleCommentId(line.id)">
                        <AppIcon name="redo" :size="18" />{{ t('review.filters.redo') }}
                    </AppButton>
                </div>
                <form v-if="openCommentId === line.id" class="stack" @submit.prevent="requestChangesId(line.id)">
                    <label class="label" :for="`page-comment-${line.id}`">{{ t('review.commentLabel') }}</label>
                    <textarea :id="`page-comment-${line.id}`" v-model="draft" class="input" rows="3" maxlength="500" required />
                    <AppButton type="submit" class="review__action" :disabled="isBusy || draft.trim() === ''">
                        <AppIcon name="send" :size="18" />{{ t('review.sendRequest') }}
                    </AppButton>
                </form>
            </template>
        </BookPageView>
        <ol v-else class="review__lines">
            <li v-for="line in shownLines" :key="line.id" class="card stack review__line" :data-line-state="stateOf(line)">
                <div class="row row--wrap">
                    <AppAvatar :member="memberOf(line)" :size="36" />
                    <span class="label">{{ t('review.lineMeta', { page: line.pageIndex + 1, character: line.character || t('review.narrator'), voice: memberOf(line)?.name ?? t('review.voice') }) }}</span>
                    <span class="badge review__state" :class="`review__state--${stateOf(line)}`">{{ t(`review.state.${stateOf(line)}`) }}</span>
                </div>
                <p class="review__text" data-testid="review-line-text">{{ textOf(line) }}</p>
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
                        :aria-expanded="openCommentId === line.id"
                        :aria-label="t('review.redoAria', { page: line.pageIndex + 1 })"
                        @click="toggleComment(line)">
                        <AppIcon name="redo" :size="20" />{{ t('review.filters.redo') }}
                    </AppButton>
                </div>
                <form v-if="openCommentId === line.id" class="stack" @submit.prevent="requestChanges(line)">
                    <label class="label" :for="`comment-${line.id}`">{{ t('review.commentLabel') }}</label>
                    <textarea :id="`comment-${line.id}`" v-model="draft" class="input" rows="3" maxlength="500" required />
                    <div class="row row--wrap">
                        <AppButton type="submit" class="review__action" :disabled="isBusy || draft.trim() === ''">
                            <AppIcon name="send" :size="20" />{{ t('review.sendRequest') }}
                        </AppButton>
                        <AppButton variant="secondary" class="review__action" @click="openCommentId = null">{{ t('review.cancel') }}</AppButton>
                    </div>
                </form>
            </li>
        </ol>
        <p v-if="shownLines.length === 0" class="muted">{{ t('review.emptyFilter') }}</p>
    </div>
    <p v-else class="muted">{{ t('common.loading') }}</p>
</template>

<script setup lang="ts">
type FilterId = 'all' | 'to_review' | 'changes' | 'approved'

const FILTERS: { id: FilterId }[] = [{ id: 'all' }, { id: 'to_review' }, { id: 'changes' }, { id: 'approved' }]

const { t, formatDateTime } = useI18n()
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
const openCommentId = ref<string | null>(null)
const draft = ref('')
const isBusy = ref(false)
const errorMessage = ref('')
const playingLineId = ref<string | null>(null)
const isPageMode = ref(false)
const pageIndex = ref(0)

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

const lineOf = (id: string): ILine => book.value!.lines.find(line => line.id === id)!
const stateOfId = (id: string): ReviewLineState => stateOf(lineOf(id))
const hasTakeId = (id: string): boolean => hasTake(lineOf(id))
const canReviewId = (id: string): boolean => canReview(lineOf(id))
const pageView = computed(() => (book.value ? buildBookPageView(book.value, pageIndex.value, language.value) : null))

const goPage = (step: number): void => {
    const last = Math.max(0, (book.value?.pages.length ?? 1) - 1)
    pageIndex.value = Math.min(last, Math.max(0, pageIndex.value + step))
}

const matches = (line: ILine, id: FilterId): boolean => {
    const state = stateOf(line)
    if (id === 'all') {
        return true
    }
    return id === 'changes' ? state === 'changes' || state === 'stale' : state === id
}

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

const playId = (id: string): Promise<void> => play(lineOf(id))
const approveId = (id: string): Promise<void> => approve(lineOf(id))
const toggleCommentId = (id: string): void => toggleComment(lineOf(id))
const requestChangesId = (id: string): Promise<void> => requestChanges(lineOf(id))

const toggleComment = (line: ILine): void => {
    draft.value = ''
    openCommentId.value = openCommentId.value === line.id ? null : line.id
}

const requestChanges = (line: ILine): Promise<void> =>
    run(async () => {
        await reviewLine(bookId, line.id, { action: 'request_changes', comment: draft.value, language: language.value })
        openCommentId.value = null
        draft.value = ''
    })

const validateAll = (): Promise<void> => run(async () => void (await validateBook(bookId)))

onBeforeUnmount(() => player.stop())

onMounted(async () => {
    try {
        await ensureLoaded()
        if (current.value?.role !== 'parent') {
            await navigateTo('/library')
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

.review__chip {
    min-height: 44px;
}

.review__state--approved {
    background: var(--mint);
}

.review__state--changes,
.review__state--stale {
    background: var(--coral);
}

.review__state--to_review {
    background: var(--sun);
}

.review__thread li {
    border: 2px solid var(--ink);
    border-radius: 12px;
    padding: 8px 10px;
    background: var(--cream);
}

.review__comment--done {
    opacity: 0.65;
}
</style>
