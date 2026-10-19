<template>
    <form class="stack filters" role="search" @submit.prevent>
        <div class="row row--wrap">
            <div class="filters__search grow">
                <AppIcon name="search" :size="22" class="filters__search-icon" />
                <AppInput v-model="text" type="search" class="filters__input" :placeholder="t('books.filters.searchPlaceholder')" :aria-label="t('books.filters.searchLabel')" />
            </div>
            <AppButton icon="settings" data-testid="filters-open" @click="isOpen = true">
                {{ t('library.filters.open') }}
                <AppBadge v-if="activeCount > 0">{{ activeCount }}</AppBadge>
            </AppButton>
        </div>
        <AppBottomSheet :open="isOpen" :title="t('library.filters.title')" @close="isOpen = false">
            <slot />
            <div class="stack filters__group" role="group" :aria-label="t('books.filters.age')">
                <span class="label filters__label"><AppIcon name="rocket" :size="22" />{{ t('books.filters.age') }}</span>
                <div class="row row--wrap">
                    <AppChip v-for="tag in AGE_TAGS" :key="tag.id" :selected="age === tag.id" @click="toggleAge(tag.id)">
                        <span aria-hidden="true">{{ AGE_EMOJIS[tag.id] }}</span> {{ t(AGE_TAG_KEYS[tag.id] ?? 'books.filters.age') }}
                    </AppChip>
                </div>
            </div>
            <AppSelect v-model="language" :aria-label="t('books.filters.language')" :options="languageOptions" />
            <div v-if="!kid && tags.length > 0" class="stack filters__group" role="group" :aria-label="t('library.filters.tag')">
                <span class="label">{{ t('library.filters.tag') }}</span>
                <div class="row row--wrap">
                    <AppChip v-for="item in tags" :key="item.slug" :selected="tag === item.slug" :data-filter="`tag-${item.slug}`" @click="tag = tag === item.slug ? '' : item.slug">
                        {{ labelOf(item, locale) }}
                    </AppChip>
                </div>
            </div>
            <div v-if="!kid" class="stack filters__group" role="group" :aria-label="t('library.filters.status')">
                <span class="label">{{ t('library.filters.status') }}</span>
                <div class="row row--wrap">
                    <AppChip v-for="item in STATUSES" :key="item" :selected="status === item" :data-filter="`status-${item}`" @click="status = status === item ? '' : item">
                        {{ t(`review.bookStatus.${item}`) }}
                    </AppChip>
                </div>
            </div>
            <div v-if="!kid" class="stack filters__group" role="group" :aria-label="t('library.filters.type')">
                <span class="label">{{ t('library.filters.type') }}</span>
                <div class="row row--wrap">
                    <AppChip v-for="item in BOOK_TYPES" :key="item" :selected="type === item" :data-filter="`type-${item}`" @click="type = type === item ? '' : item">
                        {{ t(`library.filters.types.${item}`) }}
                    </AppChip>
                </div>
            </div>
            <div class="stack filters__group" role="group" :aria-label="t('library.filters.mood')">
                <span class="label filters__label"><AppIcon name="smile" :size="22" />{{ t('library.filters.mood') }}</span>
                <div class="row row--wrap">
                    <AppChip v-for="item in BOOK_MOODS" :key="item" :selected="mood === item" :data-filter="`mood-${item}`" @click="mood = mood === item ? '' : item">
                        <span aria-hidden="true">{{ MOOD_EMOJIS[item] }}</span> {{ t(`library.filters.moods.${item}`) }}
                    </AppChip>
                </div>
            </div>
            <div class="stack filters__group" role="group" :aria-label="t('library.filters.theme')">
                <span class="label filters__label"><AppIcon name="star" :size="22" />{{ t('library.filters.theme') }}</span>
                <div class="row row--wrap">
                    <AppChip v-for="item in BOOK_THEMES" :key="item" :selected="theme === item" :data-filter="`theme-${item}`" @click="theme = theme === item ? '' : item">
                        <span aria-hidden="true">{{ THEME_EMOJIS[item] }}</span> {{ t(`library.filters.themes.${item}`) }}
                    </AppChip>
                </div>
            </div>
            <div class="row">
                <AppButton variant="secondary" class="grow" icon="redo" @click="reset">{{ t('library.filters.reset') }}</AppButton>
                <AppButton class="grow" icon="check" @click="isOpen = false">{{ t('library.filters.show') }}</AppButton>
            </div>
        </AppBottomSheet>
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

const STATUSES: BookStatus[] = ['proposed', 'draft', 'to_record', 'in_review', 'ready']

const { t, locale } = useI18n()
const { tags, ensureLoaded: loadTags } = useTags()
const { labelOf } = useTagLabel()
const languageOptions = computed(() => languageSelectOptions(LANGUAGES, t('books.filters.allLanguages')))

const { initial = {}, kid = false } = defineProps<{ initial?: Partial<IBookQuery>; kid?: boolean }>()
const emit = defineEmits<{ change: [query: IBookQuery] }>()

const text = ref(initial.q ?? '')
const language = ref(initial.language ?? '')
const age = ref(initial.age ?? '')
const type = ref(initial.type ?? '')
const mood = ref(initial.mood ?? '')
const theme = ref(initial.theme ?? '')
const tag = ref(initial.tag ?? '')
const status = ref(initial.status ?? '')

const isOpen = ref(false)
const activeCount = computed<number>(() => [type.value, mood.value, theme.value, tag.value, status.value, language.value, age.value].filter(value => value !== '').length)

const reset = (): void => {
    type.value = ''
    mood.value = ''
    theme.value = ''
    tag.value = ''
    status.value = ''
    language.value = ''
    age.value = ''
}

const toggleAge = (id: string): void => {
    age.value = age.value === id ? '' : id
}

let timer: ReturnType<typeof setTimeout> | null = null

watch([text, language, age, type, mood, theme, tag, status], () => {
    if (timer) {
        clearTimeout(timer)
    }
    timer = setTimeout(
        () => emit('change', { q: text.value, language: language.value, age: age.value, type: type.value, mood: mood.value, theme: theme.value, tag: tag.value, status: status.value }),
        SEARCH_DELAY_MS,
    )
})

onMounted(loadTags)

onBeforeUnmount(() => {
    if (timer) {
        clearTimeout(timer)
    }
})
</script>

<style scoped>
.filters__search {
    position: relative;
    flex: 1 1 8rem;
    min-width: 0;
}

.filters__search-icon {
    position: absolute;
    inset-inline-start: 14px;
    top: 50%;
    translate: 0 -50%;
    pointer-events: none;
}

.filters__input {
    width: 100%;
    min-width: 0;
    padding-inline-start: 48px;
    border-radius: 999px;
}

.filters__group {
    gap: 8px;
}

.filters__label {
    display: inline-flex;
    align-items: center;
    gap: 8px;
}
</style>
