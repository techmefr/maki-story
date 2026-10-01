<template>
    <form class="stack filters" role="search" @submit.prevent>
        <div class="row row--wrap">
            <input v-model="text" type="search" class="input grow" :placeholder="t('books.filters.searchPlaceholder')" :aria-label="t('books.filters.searchLabel')" />
            <select v-model="language" class="input filters__language" :aria-label="t('books.filters.language')">
                <option value="">{{ t('books.filters.allLanguages') }}</option>
                <option v-for="item in LANGUAGES" :key="item.code" :value="item.code">{{ item.flag }} {{ item.label }}</option>
            </select>
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

const { t } = useI18n()

const emit = defineEmits<{ change: [query: IBookQuery] }>()

const text = ref('')
const language = ref('')
const age = ref('')

const toggleAge = (id: string): void => {
    age.value = age.value === id ? '' : id
}

let timer: ReturnType<typeof setTimeout> | null = null

watch([text, language, age], () => {
    if (timer) {
        clearTimeout(timer)
    }
    timer = setTimeout(() => emit('change', { q: text.value, language: language.value, age: age.value }), SEARCH_DELAY_MS)
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
</style>
