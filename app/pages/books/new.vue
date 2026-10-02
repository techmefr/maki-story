<template>
    <div class="stack narrow">
        <NuxtLink to="/home" class="link-back"><AppIcon name="back" :size="18" class="mirror-rtl" />{{ t('common.cancel') }}</NuxtLink>
        <div class="row" style="justify-content: space-between">
            <h1 class="title">{{ stepTitle }}</h1>
            <span class="badge">{{ stepNumber }}/{{ stepCount }}</span>
        </div>
        <div v-if="!isWordless" class="row" role="group" :aria-label="t('bookDraft.wizard.voiceCount')">
            <button type="button" class="chip" :class="{ 'chip--on': isSimple }" :aria-pressed="isSimple" @click="setMode('simple')">
                {{ t('bookDraft.wizard.oneVoice') }}
            </button>
            <button type="button" class="chip" :class="{ 'chip--on': !isSimple }" :aria-pressed="!isSimple" @click="setMode('casting')">
                {{ t('bookDraft.wizard.severalVoices') }}
            </button>
        </div>
        <AiNotice v-if="isAiPrefilled" :text="t('bookDraft.wizard.aiNotice')" />
        <AiPrefillCard v-if="step === 'book' && isParent && !isAiPrefilled" />
        <BookStepBook v-if="step === 'book'" @next="goNext" />
        <BookStepPages v-else-if="step === 'pages'" @next="goNext" />
        <BookStepCharacters v-else-if="step === 'characters'" @next="goNext" />
        <BookStepLines v-else-if="step === 'lines'" @next="goNext" />
        <BookStepReview v-else />
        <AppButton variant="secondary" size="sm" v-if="step !== 'book'" @click="back">{{ t('common.back') }}</AppButton>
    </div>
</template>

<script setup lang="ts">
const STEP_TITLE_KEYS: Record<DraftStep, string> = {
    book: 'bookDraft.wizard.stepBook',
    pages: 'bookDraft.wizard.stepPages',
    characters: 'bookDraft.wizard.stepCharacters',
    lines: 'bookDraft.wizard.stepLines',
    review: 'bookDraft.wizard.stepReview',
}

const { t } = useI18n()
const { step, steps, isSimple, isWordless, isAiPrefilled, setMode, reset } = useBookDraft()
const { current, isParent } = useCurrentMember()

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

onMounted(() => {
    const member = current.value
    const isRelative = member?.role === 'relative'
    reset(isRelative ? 'simple' : 'casting', member?.id ?? null)
})
</script>
