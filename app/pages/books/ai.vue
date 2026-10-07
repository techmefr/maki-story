<template>
    <div class="stack narrow">
        <NuxtLink to="/library" class="muted">{{ t('common.cancel') }}</NuxtLink>
        <h1 class="title">{{ t('ai.page.title') }}</h1>
        <p v-if="!isParent" class="card" role="alert">{{ t('ai.page.parentsOnly') }}</p>
        <template v-else>
            <AiNotice :text="t('ai.page.notice')" />
            <AiQuota />
            <AiBudgetEditor />
            <p v-if="isUnavailable" class="error" role="alert">{{ t(AI_UNAVAILABLE_KEY) }}</p>
            <div v-if="result" class="card stack" role="status" data-testid="ai-result">
                <h2 class="subtitle">{{ t('ai.page.draftCreated') }}</h2>
                <p>{{ t('ai.page.draftBody') }}</p>
                <p v-if="result.imagesSkipped > 0" class="error" data-testid="ai-images-skipped">
                    {{ skippedLabel }}
                </p>
                <p v-if="result.imagesBlocked > 0" class="error" data-testid="ai-images-blocked">
                    {{ t('aiSafety.blocked.images', { count: result.imagesBlocked }) }}
                </p>
                <AppButton is-block to="/library">{{ t('ai.page.seeLibrary') }}</AppButton>
                <AppButton variant="secondary" is-block @click="restart">{{ t('ai.page.another') }}</AppButton>
            </div>
            <form v-else class="stack" @submit.prevent="onNext">
                <AppStepper :steps="stepperSteps" :current="stepIndex" :label="t('ai.page.steps.label')" />

                <section v-if="step === 'idea'" class="stack">
                    <h2 id="ai-step-title" ref="headingRef" class="subtitle" tabindex="-1">{{ t('ai.page.idea') }}</h2>
                    <textarea v-model="idea" class="input" maxlength="600" required aria-labelledby="ai-step-title" :placeholder="t('ai.page.ideaPlaceholder')" />
                </section>

                <section v-else-if="step === 'language'" class="stack">
                    <h2 id="ai-language-label" ref="headingRef" class="subtitle" tabindex="-1">{{ t('ai.page.storyLanguage') }}</h2>
                    <AppSelect v-model="language" aria-labelledby="ai-language-label" :options="languageOptions" />
                </section>

                <section v-else-if="step === 'ages'" class="stack">
                    <h2 ref="headingRef" class="subtitle" tabindex="-1">{{ t('ai.page.agesTitle') }}</h2>
                    <div class="row">
                        <div class="stack grow ai-field">
                            <span id="ai-age-min-label" class="label">{{ t('ai.page.ageMin') }}</span>
                            <AppSelect v-model="ageMin" aria-labelledby="ai-age-min-label" :options="ageOptions" />
                        </div>
                        <div class="stack grow ai-field">
                            <span id="ai-age-max-label" class="label">{{ t('ai.page.ageMax') }}</span>
                            <AppSelect v-model="ageMax" aria-labelledby="ai-age-max-label" :options="ageOptions" />
                        </div>
                    </div>
                    <p v-if="ageProblem" class="error" role="alert">{{ ageProblem }}</p>
                </section>

                <section v-else-if="step === 'pages'" class="stack">
                    <h2 id="ai-step-title" ref="headingRef" class="subtitle" tabindex="-1">{{ t('ai.page.pageCount') }}</h2>
                    <input v-model.number="pageCount" class="input" type="number" min="1" :max="MAX_AI_PAGES" required aria-labelledby="ai-step-title" />
                </section>

                <section v-else-if="step === 'hero'" class="stack">
                    <h2 id="ai-step-title" ref="headingRef" class="subtitle" tabindex="-1">{{ t('ai.page.hero') }}</h2>
                    <input v-model="hero" class="input" aria-labelledby="ai-step-title" :placeholder="t('ai.page.heroPlaceholder')" />
                </section>

                <section v-else class="stack">
                    <h2 ref="headingRef" class="subtitle" tabindex="-1">{{ t('ai.page.sheetTitle') }}</h2>
                    <p class="muted">
                        {{ t('ai.page.sheetIntro') }}
                    </p>
                    <div v-for="(character, index) in sheet" :key="index" class="card stack" role="group" :aria-label="t('ai.page.characterLabel', { n: index + 1 })">
                        <label class="stack ai-field">
                            <span class="label">{{ t('ai.page.name') }}</span>
                            <input v-model="character.name" class="input" />
                        </label>
                        <label class="stack ai-field">
                            <span class="label">{{ t('ai.page.description') }}</span>
                            <input v-model="character.description" class="input" :placeholder="t('ai.page.descriptionPlaceholder')" />
                        </label>
                        <AppButton variant="secondary" size="sm" :aria-label="t('ai.page.removeLabel', { n: index + 1 })" @click="sheet.splice(index, 1)">
                            {{ t('ai.page.remove') }}
                        </AppButton>
                    </div>
                    <AppButton variant="secondary" size="sm" @click="sheet.push({ name: '', description: '' })">{{ t('ai.page.add') }}</AppButton>
                    <p v-if="isBusy" class="muted" role="status">{{ t('ai.page.busyNote') }}</p>
                    <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
                </section>

                <AppStepNav :next-label="nextLabel" :can-back="stepIndex > 0" :is-disabled="!canContinue" :is-busy="isBusy" next-test-id="ai-next" @back="goBack" />
            </form>
        </template>
    </div>
</template>

<script setup lang="ts">
if (!useAiCreationEnabled()) {
    await navigateTo('/home', { replace: true })
}

type TAiStep = 'idea' | 'language' | 'ages' | 'pages' | 'hero' | 'sheet'

const AI_STEPS: TAiStep[] = ['idea', 'language', 'ages', 'pages', 'hero', 'sheet']
const AGES = Array.from({ length: 13 }, (_unused, index) => index)
const MAX_AI_PAGES = 12
const MAX_IDEA_CHARS = 1000

interface ISheetEntry {
    name: string
    description: string
}

const { t } = useI18n()
const languageOptions = languageSelectOptions(LANGUAGES)
const ageOptions = computed(() => [{ value: null, label: t('ai.page.allAges') }, ...AGES.map(age => ({ value: age, label: t('books.age.years', { count: age }) }))])
const { isParent } = useCurrentMember()
const { generateBook, refreshStatus, isExhausted, isUnavailable } = useAi()
const { load } = useBooks()

const step = ref<TAiStep>('idea')
const idea = ref('')
const language = ref(DEFAULT_LANGUAGE)
const ageMin = ref<number | null>(null)
const ageMax = ref<number | null>(null)
const pageCount = ref(4)
const hero = ref('')
const sheet = ref<ISheetEntry[]>([])
const isBusy = ref(false)
const errorMessage = ref('')
const result = ref<IAiBookGenerationResult | null>(null)

const headingRef = useStepFocus(() => step.value)

const stepIndex = computed<number>(() => AI_STEPS.indexOf(step.value))
const stepperSteps = computed(() => AI_STEPS.map(id => ({ id, label: t(`ai.page.steps.${id}`) })))
const ageProblem = computed(() => {
    return ageMin.value !== null && ageMax.value !== null && ageMin.value > ageMax.value ? t('ai.page.ageProblem') : ''
})
const canContinue = computed<boolean>(() => {
    if (step.value === 'idea') {
        return !isUnavailable.value && !isExhausted.value && idea.value.trim() !== ''
    }
    return step.value !== 'ages' || ageProblem.value === ''
})
const nextLabel = computed<string>(() => {
    if (step.value !== 'sheet') {
        return t('common.next')
    }
    return isBusy.value ? t('ai.page.generating') : t('ai.page.generate')
})
const skippedLabel = computed(() => {
    return t('ai.page.skipped', { count: result.value?.imagesSkipped ?? 0 })
})

const toSheet = (): void => {
    if (sheet.value.length === 0) {
        sheet.value = [{ name: '', description: hero.value.trim() }]
    } else if (hero.value.trim() !== '' && sheet.value[0]!.description === '') {
        sheet.value[0]!.description = hero.value.trim()
    }
}

const buildIdea = (): string => {
    const characters = sheet.value
        .filter(entry => entry.name.trim() !== '' || entry.description.trim() !== '')
        .map(entry => t('ai.page.promptEntry', { name: entry.name.trim() || t('ai.page.promptDefaultName'), description: entry.description.trim() }))
    const suffix = characters.length > 0 ? `\n${t('ai.page.promptKeepSame')}\n${characters.join('\n')}` : ''
    return `${idea.value.trim()}${suffix}`.slice(0, MAX_IDEA_CHARS)
}

const generate = async (): Promise<void> => {
    isBusy.value = true
    errorMessage.value = ''
    try {
        result.value = await generateBook({
            idea: buildIdea(),
            language: language.value,
            pageCount: pageCount.value,
            ageMin: ageMin.value,
            ageMax: ageMax.value,
        })
        await load()
    } catch (error) {
        console.error('La génération n a pas abouti', error)
        errorMessage.value = t(aiErrorKey(error))
    } finally {
        isBusy.value = false
        await refreshStatus()
    }
}

const onNext = async (): Promise<void> => {
    if (!canContinue.value) {
        return
    }
    if (step.value === 'sheet') {
        await generate()
        return
    }
    if (step.value === 'hero') {
        toSheet()
    }
    step.value = AI_STEPS[stepIndex.value + 1] ?? step.value
}

const goBack = (): void => {
    errorMessage.value = ''
    step.value = AI_STEPS[Math.max(0, stepIndex.value - 1)] ?? 'idea'
}

const restart = (): void => {
    result.value = null
    step.value = 'idea'
    idea.value = ''
    hero.value = ''
    sheet.value = []
}

onMounted(refreshStatus)
</script>

<style scoped>
.ai-field {
    gap: 6px;
}
</style>
