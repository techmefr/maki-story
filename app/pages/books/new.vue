<template>
    <div class="stack narrow">
        <BackLink to="/library">{{ t('common.cancel') }}</BackLink>
        <div class="row" style="justify-content: space-between">
            <h1 class="title">{{ stepTitle }}</h1>
            <span class="badge">{{ stepNumber }}/{{ stepCount }}</span>
        </div>
        <div v-if="!isWordless" class="row" role="group" :aria-label="t('bookDraft.wizard.voiceCount')">
            <AppChip @click="setMode('simple')" :selected="isSimple">
                {{ t('bookDraft.wizard.oneVoice') }}
            </AppChip>
            <AppChip @click="setMode('casting')" :selected="!isSimple">
                {{ t('bookDraft.wizard.severalVoices') }}
            </AppChip>
        </div>
        <AppButton v-if="step === 'book' && isParent && isOnline" variant="secondary" is-block icon="search" to="/books/isbn" data-testid="add-by-isbn">{{ t('addBook.open') }}</AppButton>
        <AiNotice v-if="isAiPrefilled" :text="t('bookDraft.wizard.aiNotice')" />
        <AiPrefillCard v-if="isAiCreationEnabled && step === 'book' && isParent && !isAiPrefilled" />
        <div v-if="isResumable" class="card stack" role="group" :aria-label="t('bookDraft.resume.title')">
            <span class="subtitle">{{ t('bookDraft.resume.title') }}</span>
            <p class="muted">{{ t('bookDraft.resume.hint') }}</p>
            <div class="row">
                <AppButton class="grow" data-testid="resume-draft" @click="resumeDraft">{{ t('bookDraft.resume.resume') }}</AppButton>
                <AppButton variant="secondary" class="grow" data-testid="discard-draft" @click="discardDraft">{{ t('bookDraft.resume.discard') }}</AppButton>
            </div>
        </div>
        <BookStepBook v-else-if="step === 'book'" @next="goNext" />
        <BookStepPages v-else-if="step === 'pages'" @next="goNext" />
        <BookStepReview v-else />
        <AppButton variant="secondary" size="sm" v-if="step !== 'book'" @click="back">{{ t('common.back') }}</AppButton>
    </div>
</template>

<script setup lang="ts">
const isAiCreationEnabled = useAiCreationEnabled()
const STEP_TITLE_KEYS: Record<DraftStep, string> = {
    book: 'bookDraft.wizard.stepBook',
    pages: 'bookDraft.wizard.stepPages',
    review: 'bookDraft.wizard.stepReview',
}

const { t } = useI18n()
const { step, steps, isSimple, isWordless, isAiPrefilled, title, pages, lines, characters, setMode, reset, saveDraft, restoreDraft, hasSavedDraft, clearDraft } = useBookDraft()
const { current, isParent } = useCurrentMember()
const isOnline = useState<boolean>('is-online', () => true)

const stepCount = computed(() => steps.value.length)
const stepNumber = computed(() => Math.max(1, steps.value.indexOf(step.value) + 1))
const stepTitle = computed(() => t(STEP_TITLE_KEYS[step.value]))

const move = (offset: number): void => {
    const index = steps.value.indexOf(step.value)
    step.value = steps.value[Math.min(steps.value.length - 1, Math.max(0, index + offset))] ?? 'book'
}

const goNext = (): void => move(1)
const back = (): void => move(-1)

watch(steps, list => {
    if (!list.includes(step.value)) {
        step.value = 'pages'
    }
})

const isResumable = ref(false)
const isAutosaving = ref(false)

const startFresh = (): void => {
    const member = current.value
    const isRelative = member?.role === 'relative'
    reset(isRelative ? 'simple' : 'casting', member?.id ?? null)
}

const resumeDraft = (): void => {
    restoreDraft()
    isResumable.value = false
    isAutosaving.value = true
}

const discardDraft = (): void => {
    clearDraft()
    startFresh()
    isResumable.value = false
    isAutosaving.value = true
}

let saveTimer: ReturnType<typeof setTimeout> | undefined

watch(
    () => [title.value, pages.value, lines.value, characters.value, step.value],
    () => {
        if (!isAutosaving.value || (title.value.trim() === '' && pages.value.length === 0)) {
            return
        }
        clearTimeout(saveTimer)
        saveTimer = setTimeout(saveDraft, 600)
    },
    { deep: true },
)

onBeforeUnmount(() => clearTimeout(saveTimer))

onMounted(() => {
    startFresh()
    if (hasSavedDraft()) {
        isResumable.value = true
        return
    }
    isAutosaving.value = true
})
</script>
