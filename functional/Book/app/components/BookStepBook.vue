<template>
    <form class="stack" data-testid="book-substep" :data-substep="subStep" @submit.prevent="goNext">
        <p class="muted" data-testid="book-substep-progress">{{ t('common.progress', { current: subIndex + 1, total: subSteps.length }) }}</p>

        <section v-if="subStep === 'title'" class="stack">
            <h2 id="book-title-label" ref="headingRef" class="subtitle" tabindex="-1">{{ t('bookDraft.book.title') }}</h2>
            <input v-model="title" class="input" aria-labelledby="book-title-label" :placeholder="t('bookDraft.book.titlePlaceholder')" />
        </section>

        <section v-else-if="subStep === 'reader'" class="stack">
            <h2 ref="headingRef" class="subtitle" tabindex="-1">{{ t('bookDraft.book.reader') }}</h2>
            <MemberPicker :model-value="readerId" @update:model-value="setReader" />
        </section>

        <section v-else-if="subStep === 'type'" class="stack" role="group" aria-labelledby="book-type-label">
            <h2 id="book-type-label" ref="headingRef" class="subtitle" tabindex="-1">{{ t('bookDraft.book.type') }}</h2>
            <div class="row row--wrap">
                <AppChip v-for="option in TYPE_OPTIONS" :key="option.id" :selected="type === option.id" @click="type = option.id">
                    {{ t(option.labelKey) }}
                </AppChip>
            </div>
            <p class="muted">{{ typeHint }}</p>
        </section>

        <section v-else-if="subStep === 'language'" class="stack">
            <h2 id="book-language-label" ref="headingRef" class="subtitle" tabindex="-1">{{ t('bookDraft.book.language') }}</h2>
            <AppSelect v-model="language" aria-labelledby="book-language-label" :options="languageOptions" />
        </section>

        <section v-else-if="subStep === 'voices'" class="stack">
            <h2 ref="headingRef" class="subtitle" tabindex="-1">{{ t('bookDraft.book.voiceLanguages') }}</h2>
            <LanguagePicker v-model="voiceLanguages" :label="t('bookDraft.book.voiceLanguages')" />
            <p class="muted">{{ t('bookDraft.book.voiceLanguagesHint') }}</p>
        </section>

        <section v-else class="stack">
            <h2 ref="headingRef" class="subtitle" tabindex="-1">{{ t('bookDraft.book.more') }}</h2>
            <AppButton variant="secondary" icon="settings" data-testid="book-tags-open" @click="isTagsOpen = true">
                {{ t('bookCreate.tagsOpen') }}
                <AppBadge v-if="tagCount > 0">{{ tagCount }}</AppBadge>
            </AppButton>
            <label class="stack book-field">
                <span class="label">{{ t('bookDraft.book.subtitle') }}</span>
                <input v-model="subtitle" class="input" />
            </label>
            <label class="stack book-field">
                <span class="label">{{ type === 'child-written' ? t('bookDraft.book.authorChild') : t('bookDraft.book.author') }}</span>
                <input v-model="author" class="input" />
            </label>
            <label class="stack book-field">
                <span class="label">{{ t('bookDraft.book.illustrator') }}</span>
                <input v-model="illustrator" class="input" />
            </label>
            <div class="row">
                <label class="stack grow book-field">
                    <span class="label">{{ t('bookDraft.book.ageMin') }}</span>
                    <input v-model.number="ageMin" class="input" type="number" min="0" max="18" inputmode="numeric" />
                </label>
                <label class="stack grow book-field">
                    <span class="label">{{ t('bookDraft.book.ageMax') }}</span>
                    <input v-model.number="ageMax" class="input" type="number" min="0" max="18" inputmode="numeric" />
                </label>
            </div>
            <AppCheckbox v-model="ttsFallback">{{ t('bookDraft.book.tts') }}</AppCheckbox>
        </section>

        <AppBottomSheet :open="isTagsOpen" :title="t('bookCreate.tagsTitle')" @close="isTagsOpen = false">
            <fieldset class="stack fieldset">
                <legend class="label">{{ t('bookDraft.book.moods') }}</legend>
                <div class="row row--wrap">
                    <AppChip v-for="mood in BOOK_MOODS" :key="mood" :selected="moods.includes(mood)" @click="toggleTag(moods, mood, MAX_BOOK_MOODS)">
                        {{ t(`bookDraft.book.mood.${mood}`) }}
                    </AppChip>
                </div>
            </fieldset>
            <fieldset class="stack fieldset">
                <legend class="label">{{ t('bookDraft.book.themes') }}</legend>
                <div class="row row--wrap">
                    <AppChip v-for="theme in BOOK_THEMES" :key="theme" :selected="themes.includes(theme)" @click="toggleTag(themes, theme, MAX_BOOK_THEMES)">
                        {{ t(`bookDraft.book.theme.${theme}`) }}
                    </AppChip>
                </div>
            </fieldset>
            <AppButton is-block @click="isTagsOpen = false">{{ t('bookCreate.tagsDone') }}</AppButton>
        </AppBottomSheet>

        <div v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</div>
        <AppStepNav :next-label="t('common.next')" :can-back="subIndex > 0" next-test-id="book-next" @back="goBack" />
    </form>
</template>

<script setup lang="ts">
type TBookSubStep = 'title' | 'reader' | 'type' | 'language' | 'voices' | 'more'

const emit = defineEmits<{ next: [] }>()

const TYPE_OPTIONS: { id: BookType; labelKey: string; hintKey: string }[] = [
    { id: 'standard', labelKey: 'bookDraft.book.typeStandard', hintKey: 'bookDraft.book.hintStandard' },
    { id: 'comic', labelKey: 'bookDraft.book.typeComic', hintKey: 'bookDraft.book.hintComic' },
    { id: 'wordless', labelKey: 'bookDraft.book.typeWordless', hintKey: 'bookDraft.book.hintWordless' },
    { id: 'child-written', labelKey: 'bookDraft.book.typeChild', hintKey: 'bookDraft.book.hintChild' },
]

const { t } = useI18n()
const languageOptions = languageSelectOptions(LANGUAGES)
const { title, subtitle, author, illustrator, ageMin, ageMax, language, voiceLanguages, moods, themes, type, ttsFallback, readerId, isSimple, isWordless, setReader } = useBookDraft()

const subStep = ref<TBookSubStep>('title')
const errorMessage = ref('')
const isTagsOpen = ref(false)

const headingRef = useStepFocus(() => subStep.value)

const subSteps = computed<TBookSubStep[]>(() => (isSimple.value && !isWordless.value ? ['title', 'reader', 'type', 'language', 'voices', 'more'] : ['title', 'type', 'language', 'voices', 'more']))
const subIndex = computed<number>(() => Math.max(0, subSteps.value.indexOf(subStep.value)))
const tagCount = computed(() => moods.value.length + themes.value.length)
const typeHint = computed(() => {
    const option = TYPE_OPTIONS.find(item => item.id === type.value)
    return option ? t(option.hintKey) : ''
})

watch(subSteps, list => {
    if (!list.includes(subStep.value)) {
        subStep.value = 'type'
    }
})

const problemOf = (current: TBookSubStep): string => {
    if (current === 'title' && title.value.trim() === '') {
        return t('bookDraft.book.errTitle')
    }
    if (current === 'reader' && readerId.value === null) {
        return t('bookDraft.book.errReader')
    }
    if (current === 'more' && ageMin.value !== null && ageMax.value !== null && ageMin.value > ageMax.value) {
        return t('bookDraft.book.errAge')
    }
    return ''
}

const goNext = (): void => {
    errorMessage.value = problemOf(subStep.value)
    if (errorMessage.value !== '') {
        return
    }
    const following = subSteps.value[subIndex.value + 1]
    if (following === undefined) {
        emit('next')
        return
    }
    subStep.value = following
}

const goBack = (): void => {
    errorMessage.value = ''
    subStep.value = subSteps.value[Math.max(0, subIndex.value - 1)] ?? 'title'
}

const toggleTag = (list: string[], tag: string, max: number): void => {
    const index = list.indexOf(tag)
    if (index >= 0) {
        list.splice(index, 1)
    } else if (list.length < max) {
        list.push(tag)
    }
}
</script>

<style scoped>
.fieldset {
    border: 0;
    padding: 0;
    margin: 0;
}

.book-field {
    gap: 6px;
}
</style>
