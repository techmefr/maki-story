<template>
    <form class="stack filters" role="search" @submit.prevent>
        <div class="row row--wrap">
            <input v-model="text" type="search" class="input grow" :placeholder="t('books.filters.searchPlaceholder')" :aria-label="t('books.filters.searchLabel')" />
            <AppSelect v-model="language" class="filters__language" :aria-label="t('books.filters.language')" :options="languageOptions" />
        </div>
        <div class="row row--wrap" role="group" :aria-label="t('books.filters.age')">
            <button
                v-for="tag in AGE_TAGS"
                :key="tag.id"
                type="button"
                class="chip"
                :class="{ 'chip--on': age === tag.id }"
                :aria-pressed="age === tag.id"
                @click="toggleAge(tag.id)"
            >
                {{ t(AGE_TAG_KEYS[tag.id] ?? 'books.filters.age') }}
            </button>
        </div>
        <details class="stack filters__more" :open="hasExtra">
            <summary class="btn btn--white btn--small">
                <AppIcon name="chevron-down" :size="16" />{{ t('library.filters.more') }}
            </summary>
            <div class="row row--wrap" role="group" :aria-label="t('library.filters.type')">
                <button
                    v-for="item in BOOK_TYPES"
                    :key="item"
                    type="button"
                    class="chip"
                    :class="{ 'chip--on': type === item }"
                    :aria-pressed="type === item"
                    :data-filter="`type-${item}`"
                    @click="type = type === item ? '' : item"
                >
                    {{ t(`library.filters.types.${item}`) }}
                </button>
            </div>
            <div class="row row--wrap" role="group" :aria-label="t('library.filters.mood')">
                <button
                    v-for="item in BOOK_MOODS"
                    :key="item"
                    type="button"
                    class="chip"
                    :class="{ 'chip--on': mood === item }"
                    :aria-pressed="mood === item"
                    :data-filter="`mood-${item}`"
                    @click="mood = mood === item ? '' : item"
                >
                    {{ t(`library.filters.moods.${item}`) }}
                </button>
            </div>
            <div class="row row--wrap" role="group" :aria-label="t('library.filters.theme')">
                <button
                    v-for="item in BOOK_THEMES"
                    :key="item"
                    type="button"
                    class="chip"
                    :class="{ 'chip--on': theme === item }"
                    :aria-pressed="theme === item"
                    :data-filter="`theme-${item}`"
                    @click="theme = theme === item ? '' : item"
                >
                    {{ t(`library.filters.themes.${item}`) }}
                </button>
            </div>
        </details>
    </form>
</template>

<script setup lang="ts">
const SEARCH_DELAY_MS = 250
const AGE_TAG_KEYS: Record<string, string> = {
    '0-3': 'books.filters.age0_3',
    '4-6': 'books.filters.age4_6',
    '7-9': 'books.filters.age7_9',
    '10+': 'books.filters.age10',
}
const BOOK_TYPES: BookType[] = ['standard', 'comic', 'wordless', 'child-written']

const { t } = useI18n()
const languageOptions = computed(() => languageSelectOptions(LANGUAGES, t('books.filters.allLanguages')))

const { initial = {} } = defineProps<{ initial?: Partial<IBookQuery> }>()
const emit = defineEmits<{ change: [query: IBookQuery] }>()

const text = ref('')
const language = ref('')
const age = ref('')
const type = ref(initial.type ?? '')
const mood = ref(initial.mood ?? '')
const theme = ref(initial.theme ?? '')

const hasExtra = computed(() => type.value !== '' || mood.value !== '' || theme.value !== '')

const toggleAge = (id: string): void => {
    age.value = age.value === id ? '' : id
}

let timer: ReturnType<typeof setTimeout> | null = null

watch([text, language, age, type, mood, theme], () => {
    if (timer) {
        clearTimeout(timer)
    }
    timer = setTimeout(
        () => emit('change', { q: text.value, language: language.value, age: age.value, type: type.value, mood: mood.value, theme: theme.value }),
        SEARCH_DELAY_MS,
    )
})

onBeforeUnmount(() => {
    if (timer) {
        clearTimeout(timer)
    }
})
</script>

<style scoped>
.filters__language {
    width: auto;
    min-width: 170px;
}

.filters__more > summary {
    display: inline-flex;
    cursor: pointer;
    list-style: none;
    margin-bottom: 8px;
}

.filters__more > summary::-webkit-details-marker {
    display: none;
}
</style>
