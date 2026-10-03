<template>
    <div class="stack">
        <label class="stack" style="gap: 6px">
            <span class="label">{{ t('bookDraft.book.title') }}</span>
            <input v-model="title" class="input" :placeholder="t('bookDraft.book.titlePlaceholder')" />
        </label>
        <fieldset class="stack fieldset">
            <legend class="label">{{ t('bookDraft.book.type') }}</legend>
            <div class="row row--wrap">
                <AppChip
                    v-for="option in TYPE_OPTIONS"
                    :key="option.id"
                    @click="type = option.id"
                 :selected="type === option.id">
                    {{ t(option.labelKey) }}
                </AppChip>
            </div>
            <p class="muted">{{ typeHint }}</p>
        </fieldset>
        <div class="stack" style="gap: 6px">
            <span id="book-language-label" class="label">{{ t('bookDraft.book.language') }}</span>
            <AppSelect v-model="language" aria-labelledby="book-language-label" :options="languageOptions" />
        </div>
        <div class="stack" style="gap: 6px">
            <span class="label">{{ t('bookDraft.book.voiceLanguages') }}</span>
            <LanguagePicker v-model="voiceLanguages" :label="t('bookDraft.book.voiceLanguages')" />
            <p class="muted">{{ t('bookDraft.book.voiceLanguagesHint') }}</p>
        </div>
        <fieldset class="stack fieldset">
            <legend class="label">{{ t('bookDraft.book.moods') }}</legend>
            <div class="row row--wrap">
                <AppChip v-for="mood in BOOK_MOODS" :key="mood" @click="toggleTag(moods, mood, MAX_BOOK_MOODS)" :selected="moods.includes(mood)">
                    {{ t(`bookDraft.book.mood.${mood}`) }}
                </AppChip>
            </div>
        </fieldset>
        <fieldset class="stack fieldset">
            <legend class="label">{{ t('bookDraft.book.themes') }}</legend>
            <div class="row row--wrap">
                <AppChip v-for="theme in BOOK_THEMES" :key="theme" @click="toggleTag(themes, theme, MAX_BOOK_THEMES)" :selected="themes.includes(theme)">
                    {{ t(`bookDraft.book.theme.${theme}`) }}
                </AppChip>
            </div>
        </fieldset>
        <div v-if="isSimple && !isWordless" class="card stack">
            <span class="subtitle">{{ t('bookDraft.book.reader') }}</span>
            <MemberPicker :model-value="readerId" @update:model-value="setReader" />
        </div>
        <details class="card stack">
            <summary class="subtitle">{{ t('bookDraft.book.more') }}</summary>
            <div class="stack" style="margin-top: 12px">
                <label class="stack" style="gap: 6px">
                    <span class="label">{{ t('bookDraft.book.subtitle') }}</span>
                    <input v-model="subtitle" class="input" />
                </label>
                <label class="stack" style="gap: 6px">
                    <span class="label">{{ type === 'child-written' ? t('bookDraft.book.authorChild') : t('bookDraft.book.author') }}</span>
                    <input v-model="author" class="input" />
                </label>
                <label class="stack" style="gap: 6px">
                    <span class="label">{{ t('bookDraft.book.illustrator') }}</span>
                    <input v-model="illustrator" class="input" />
                </label>
                <div class="row">
                    <label class="stack grow" style="gap: 6px">
                        <span class="label">{{ t('bookDraft.book.ageMin') }}</span>
                        <input v-model.number="ageMin" class="input" type="number" min="0" max="18" inputmode="numeric" />
                    </label>
                    <label class="stack grow" style="gap: 6px">
                        <span class="label">{{ t('bookDraft.book.ageMax') }}</span>
                        <input v-model.number="ageMax" class="input" type="number" min="0" max="18" inputmode="numeric" />
                    </label>
                </div>
                <AppCheckbox v-model="ttsFallback">{{ t('bookDraft.book.tts') }}</AppCheckbox>
            </div>
        </details>
        <div v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</div>
        <AppButton is-block @click="goNext">{{ t('common.next') }}</AppButton>
    </div>
</template>

<script setup lang="ts">
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

const errorMessage = ref('')
const typeHint = computed(() => {
    const option = TYPE_OPTIONS.find(item => item.id === type.value)
    return option ? t(option.hintKey) : ''
})

const goNext = (): void => {
    errorMessage.value = ''
    if (title.value.trim() === '') {
        errorMessage.value = t('bookDraft.book.errTitle')
        return
    }
    if (isSimple.value && !isWordless.value && readerId.value === null) {
        errorMessage.value = t('bookDraft.book.errReader')
        return
    }
    if (ageMin.value !== null && ageMax.value !== null && ageMin.value > ageMax.value) {
        errorMessage.value = t('bookDraft.book.errAge')
        return
    }
    emit('next')
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

</style>
