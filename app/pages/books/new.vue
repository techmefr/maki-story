<template>
    <div class="stack narrow">
        <BackLink to="/library">{{ t('common.cancel') }}</BackLink>
        <div class="row" style="justify-content: space-between">
            <h1 ref="headingRef" class="title" tabindex="-1">{{ stepTitle }}</h1>
            <span v-if="step === 'book'" class="badge">{{ t('bookCreate.flow.stepLabel', { n: 1 }) }}</span>
        </div>
        <AppStepper :steps="flowSteps" :current="0" :label="t('review.flow.label')" />
        <AiNotice v-if="isAiPrefilled" :text="t('bookDraft.wizard.aiNotice')" />
        <AiPrefillCard v-if="isAiCreationEnabled && step === 'book' && isParent && !isAiPrefilled" />
        <section v-if="sent" class="stack" data-testid="send-done">
            <MakiScene :pose="sent.isSilent ? 'mute' : 'winged'" :size="220" />
            <p class="card subtitle" role="status">{{ sent.isSilent ? t('bookCreate.flow.silentBookReady') : t('bookCreate.flow.requestsSent') }}</p>
            <AppButton is-block data-testid="send-studio" :to="`/books/${sent.id}/studio`">{{ t('bookCreate.flow.goStudio') }}</AppButton>
            <AppButton variant="secondary" is-block to="/library">{{ t('bookCreate.flow.goLibrary') }}</AppButton>
        </section>
        <div v-else-if="isResumable" class="card stack" role="group" :aria-label="t('bookDraft.resume.title')">
            <span class="subtitle">{{ t('bookDraft.resume.title') }}</span>
            <p class="muted">{{ t('bookDraft.resume.hint') }}</p>
            <div class="row">
                <AppButton class="grow" data-testid="resume-draft" @click="resumeDraft">{{ t('bookDraft.resume.resume') }}</AppButton>
                <AppButton variant="secondary" class="grow" data-testid="discard-draft" @click="discardDraft">{{ t('bookDraft.resume.discard') }}</AppButton>
            </div>
        </div>
        <BookCoverStep v-else-if="step === 'book'" @next="startPages" @save="saveNow" />
        <BookPageStep v-else-if="step === 'pages'" @back="backFromPage" @finish="step = 'review'" />
        <BookSendStep v-else @back="step = 'pages'" @sent="sent = $event" />
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
const { step, cursor, isAiPrefilled, title, pages, lines, characters, reset, saveDraft, restoreDraft, hasSavedDraft, clearDraft, clearServerDraft, loadServerDraft, syncDraft } = useBookDraft()
const { current, isParent } = useCurrentMember()

const headingRef = useStepFocus(() => step.value)
const flowSteps = computed(() => ['create', 'record', 'send', 'validate'].map(id => ({ id, label: t(`review.flow.${id}`) })))

const stepTitle = computed(() => t(STEP_TITLE_KEYS[step.value]))

const startPages = async (): Promise<void> => {
    cursor.value = 0
    step.value = 'pages'
    await syncDraft()
}

const backFromPage = (): void => {
    if (cursor.value === 0) {
        step.value = 'book'
        return
    }
    cursor.value -= 1
}

const saveNow = async (): Promise<void> => {
    await syncDraft()
}

const sent = ref<{ id: string; isSilent: boolean } | null>(null)
const isResumable = ref(false)
const isAutosaving = ref(false)

const startFresh = (): void => {
    const member = current.value
    const isRelative = member?.role === 'relative'
    reset(isRelative ? 'simple' : 'casting', member?.id ?? null)
}

let serverDraft: Record<string, unknown> | null = null

const resumeDraft = (): void => {
    restoreDraft(serverDraft)
    isResumable.value = false
    isAutosaving.value = true
}

const discardDraft = async (): Promise<void> => {
    clearDraft()
    await clearServerDraft()
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

onMounted(async () => {
    startFresh()
    serverDraft = await loadServerDraft()
    if (serverDraft !== null || hasSavedDraft()) {
        isResumable.value = true
        return
    }
    isAutosaving.value = true
})
</script>
