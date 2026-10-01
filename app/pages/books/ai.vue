<template>
    <div class="stack narrow">
        <NuxtLink to="/home" class="muted">{{ t('common.cancel') }}</NuxtLink>
        <h1 class="title">{{ t('ai.page.title') }}</h1>
        <p v-if="!isParent" class="card" role="alert">{{ t('ai.page.parentsOnly') }}</p>
        <template v-else>
            <AiNotice :text="t('ai.page.notice')" />
            <AiQuota />
            <p v-if="isUnavailable" class="error" role="alert">{{ t(AI_UNAVAILABLE_KEY) }}</p>
            <div v-if="result" class="card stack" role="status" data-testid="ai-result">
                <h2 class="subtitle">{{ t('ai.page.draftCreated') }}</h2>
                <p>{{ t('ai.page.draftBody') }}</p>
                <p v-if="result.imagesSkipped > 0" class="error" data-testid="ai-images-skipped">
                    {{ skippedLabel }}
                </p>
                <NuxtLink to="/home" class="btn btn--block">{{ t('ai.page.seeLibrary') }}</NuxtLink>
                <button type="button" class="btn btn--white btn--block" @click="restart">{{ t('ai.page.another') }}</button>
            </div>
            <form v-else-if="step === 'idea'" class="stack" @submit.prevent="toSheet">
                <label class="stack" style="gap: 6px">
                    <span class="label">{{ t('ai.page.idea') }}</span>
                    <textarea v-model="idea" class="input" maxlength="600" required :placeholder="t('ai.page.ideaPlaceholder')" />
                </label>
                <label class="stack" style="gap: 6px">
                    <span class="label">{{ t('ai.page.storyLanguage') }}</span>
                    <select v-model="language" class="input">
                        <option v-for="item in LANGUAGES" :key="item.code" :value="item.code">{{ item.flag }} {{ item.label }}</option>
                    </select>
                </label>
                <div class="row">
                    <label class="stack grow" style="gap: 6px">
                        <span class="label">{{ t('ai.page.ageMin') }}</span>
                        <select v-model="ageMin" class="input">
                            <option :value="null">{{ t('ai.page.allAges') }}</option>
                            <option v-for="age in AGES" :key="age" :value="age">{{ t('books.age.years', { count: age }) }}</option>
                        </select>
                    </label>
                    <label class="stack grow" style="gap: 6px">
                        <span class="label">{{ t('ai.page.ageMax') }}</span>
                        <select v-model="ageMax" class="input">
                            <option :value="null">{{ t('ai.page.allAges') }}</option>
                            <option v-for="age in AGES" :key="age" :value="age">{{ t('books.age.years', { count: age }) }}</option>
                        </select>
                    </label>
                </div>
                <label class="stack" style="gap: 6px">
                    <span class="label">{{ t('ai.page.pageCount') }}</span>
                    <input v-model.number="pageCount" class="input" type="number" min="1" :max="MAX_AI_PAGES" required />
                </label>
                <label class="stack" style="gap: 6px">
                    <span class="label">{{ t('ai.page.hero') }}</span>
                    <input v-model="hero" class="input" :placeholder="t('ai.page.heroPlaceholder')" />
                </label>
                <p v-if="ageProblem" class="error" role="alert">{{ ageProblem }}</p>
                <button type="submit" class="btn btn--block" :disabled="isUnavailable || isExhausted || ageProblem !== '' || idea.trim() === ''">{{ t('common.next') }}</button>
            </form>
            <div v-else class="stack">
                <h2 class="subtitle">{{ t('ai.page.sheetTitle') }}</h2>
                <p class="muted">
                    {{ t('ai.page.sheetIntro') }}
                </p>
                <div v-for="(character, index) in sheet" :key="index" class="card stack" role="group" :aria-label="t('ai.page.characterLabel', { n: index + 1 })">
                    <label class="stack" style="gap: 6px">
                        <span class="label">{{ t('ai.page.name') }}</span>
                        <input v-model="character.name" class="input" />
                    </label>
                    <label class="stack" style="gap: 6px">
                        <span class="label">{{ t('ai.page.description') }}</span>
                        <input v-model="character.description" class="input" :placeholder="t('ai.page.descriptionPlaceholder')" />
                    </label>
                    <button type="button" class="btn btn--white btn--small" :aria-label="t('ai.page.removeLabel', { n: index + 1 })" @click="sheet.splice(index, 1)">
                        {{ t('ai.page.remove') }}
                    </button>
                </div>
                <button type="button" class="btn btn--white btn--small" @click="sheet.push({ name: '', description: '' })">{{ t('ai.page.add') }}</button>
                <p v-if="isBusy" class="muted" role="status">{{ t('ai.page.busyNote') }}</p>
                <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
                <button type="button" class="btn btn--block" :disabled="isBusy" @click="generate">
                    {{ isBusy ? t('ai.page.generating') : t('ai.page.generate') }}
                </button>
                <button type="button" class="btn btn--white btn--small" :disabled="isBusy" @click="step = 'idea'">{{ t('common.back') }}</button>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
const AGES = Array.from({ length: 13 }, (_unused, index) => index)
const MAX_AI_PAGES = 12
const MAX_IDEA_CHARS = 1000

interface ISheetEntry {
    name: string
    description: string
}

const { t } = useI18n()
const { isParent } = useCurrentMember()
const { generateBook, refreshStatus, isExhausted, isUnavailable } = useAi()
const { load } = useBooks()

const step = ref<'idea' | 'sheet'>('idea')
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

const ageProblem = computed(() => {
    return ageMin.value !== null && ageMax.value !== null && ageMin.value > ageMax.value ? t('ai.page.ageProblem') : ''
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
    step.value = 'sheet'
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

const restart = (): void => {
    result.value = null
    step.value = 'idea'
    idea.value = ''
    hero.value = ''
    sheet.value = []
}

onMounted(refreshStatus)
</script>
