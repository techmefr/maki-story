<template>
    <form class="stack filters" role="search" @submit.prevent>
        <div class="row row--wrap">
            <input v-model="text" type="search" class="input grow" placeholder="Titre, auteur…" aria-label="Rechercher un livre" />
            <select v-model="language" class="input filters__language" aria-label="Langue">
                <option value="">Toutes les langues</option>
                <option v-for="item in LANGUAGES" :key="item.code" :value="item.code">{{ item.flag }} {{ item.label }}</option>
            </select>
        </div>
        <div class="row row--wrap" role="group" aria-label="Âge">
            <button
                v-for="tag in AGE_TAGS"
                :key="tag.id"
                type="button"
                class="chip"
                :class="{ 'chip--on': age === tag.id }"
                :aria-pressed="age === tag.id"
                @click="toggleAge(tag.id)"
            >
                {{ tag.label }}
            </button>
        </div>
    </form>
</template>

<script setup lang="ts">
const SEARCH_DELAY_MS = 250

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
