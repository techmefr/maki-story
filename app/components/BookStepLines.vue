<template>
    <div class="stack">
        <p class="muted">
            Recopie les répliques, page par page. Le texte sert seulement à découper : l’enfant ne le verra jamais.
        </p>
        <div v-for="pageIndex in pageCount" :key="pageIndex" class="card stack">
            <div class="row" style="justify-content: space-between">
                <span class="subtitle">Page {{ pageIndex }}</span>
                <span class="badge">{{ linesOfPage(pageIndex - 1).length }} répliques</span>
            </div>
            <div v-for="line in linesOfPage(pageIndex - 1)" :key="line.key" class="row">
                <div class="grow">
                    <div class="label">{{ line.character || 'Narrateur' }}</div>
                    <div>{{ line.text }}</div>
                </div>
                <button type="button" class="btn btn--small btn--white" @click="removeLine(line.key)">×</button>
            </div>
            <template v-if="openPage === pageIndex - 1">
                <div v-if="!isSolo" class="row row--wrap">
                    <button v-for="name in suggestions" :key="name" type="button" class="chip" @click="character = name">
                        {{ name }}
                    </button>
                </div>
                <input v-if="!isSolo" v-model="character" class="input" placeholder="Qui parle ? (Narrateur, Petit Zébu…)" />
                <textarea v-model="text" class="input" placeholder="Ce que dit le personnage" />
                <div class="row">
                    <button type="button" class="btn btn--white grow" @click="openPage = null">Annuler</button>
                    <button type="button" class="btn grow" :disabled="text.trim() === ''" @click="add(pageIndex - 1)">
                        Ajouter
                    </button>
                </div>
            </template>
            <button v-else type="button" class="btn btn--white btn--small" @click="openForm(pageIndex - 1)">
                Ajouter une réplique
            </button>
        </div>
        <button v-if="pages.length === 0" type="button" class="btn btn--white btn--block" @click="extraPages++">
            Ajouter une page
        </button>
        <button type="button" class="btn btn--block" :disabled="!hasLines" @click="emit('next')">Suivant</button>
    </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{ next: [] }>()

const { pages, pageCount: basePageCount, characters, hasLines, isSolo, addLine, removeLine, linesOfPage } = useBookDraft()

const extraPages = ref(0)
const openPage = ref<number | null>(0)
const character = ref('Narrateur')
const text = ref('')

const pageCount = computed(() => (pages.value.length > 0 ? basePageCount.value : 1 + extraPages.value))
const suggestions = computed(() => [...new Set(['Narrateur', ...characters.value])])

const openForm = (pageIndex: number): void => {
    openPage.value = pageIndex
    text.value = ''
}

const add = (pageIndex: number): void => {
    addLine(pageIndex, isSolo.value ? '' : character.value, text.value)
    text.value = ''
}
</script>
