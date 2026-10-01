<template>
    <div class="stack narrow">
        <NuxtLink to="/home" class="muted">Annuler</NuxtLink>
        <h1 class="title">Créer une histoire avec l’IA</h1>
        <p v-if="!isParent" class="card" role="alert">Seuls les parents peuvent créer une histoire avec l’IA.</p>
        <template v-else>
            <AiNotice text="L’histoire et les images sont inventées par l’IA. Elle arrive cachée dans « À valider » : les enfants ne la voient qu’après ta validation." />
            <AiQuota />
            <p v-if="isUnavailable" class="error" role="alert">{{ AI_UNAVAILABLE_MESSAGE }}</p>
            <div v-if="result" class="card stack" role="status" data-testid="ai-result">
                <h2 class="subtitle">Brouillon créé</h2>
                <p>Il t’attend dans la rangée « À valider » de la bibliothèque. Relis-le, puis valide-le.</p>
                <p v-if="result.imagesSkipped > 0" class="error" data-testid="ai-images-skipped">
                    {{ skippedLabel }}
                </p>
                <NuxtLink to="/home" class="btn btn--block">Voir dans la bibliothèque</NuxtLink>
                <button type="button" class="btn btn--white btn--block" @click="restart">Créer une autre histoire</button>
            </div>
            <form v-else-if="step === 'idea'" class="stack" @submit.prevent="toSheet">
                <label class="stack" style="gap: 6px">
                    <span class="label">Ton idée d’histoire</span>
                    <textarea v-model="idea" class="input" maxlength="600" required placeholder="Un petit zébu qui a peur de l’orage…" />
                </label>
                <label class="stack" style="gap: 6px">
                    <span class="label">Langue de l’histoire</span>
                    <select v-model="language" class="input">
                        <option v-for="item in LANGUAGES" :key="item.code" :value="item.code">{{ item.flag }} {{ item.label }}</option>
                    </select>
                </label>
                <div class="row">
                    <label class="stack grow" style="gap: 6px">
                        <span class="label">Âge minimum</span>
                        <select v-model="ageMin" class="input">
                            <option :value="null">Tous</option>
                            <option v-for="age in AGES" :key="age" :value="age">{{ age }} ans</option>
                        </select>
                    </label>
                    <label class="stack grow" style="gap: 6px">
                        <span class="label">Âge maximum</span>
                        <select v-model="ageMax" class="input">
                            <option :value="null">Tous</option>
                            <option v-for="age in AGES" :key="age" :value="age">{{ age }} ans</option>
                        </select>
                    </label>
                </div>
                <label class="stack" style="gap: 6px">
                    <span class="label">Nombre de pages</span>
                    <input v-model.number="pageCount" class="input" type="number" min="1" :max="MAX_AI_PAGES" required />
                </label>
                <label class="stack" style="gap: 6px">
                    <span class="label">Décris le héros (facultatif)</span>
                    <input v-model="hero" class="input" placeholder="Un zébu brun avec une écharpe rouge" />
                </label>
                <p v-if="ageProblem" class="error" role="alert">{{ ageProblem }}</p>
                <button type="submit" class="btn btn--block" :disabled="isUnavailable || isExhausted || ageProblem !== '' || idea.trim() === ''">Suivant</button>
            </form>
            <div v-else class="stack">
                <h2 class="subtitle">Les personnages</h2>
                <p class="muted">
                    Cette fiche reste la même sur toutes les pages, pour que les personnages gardent le même aspect. Modifie-la si besoin.
                </p>
                <div v-for="(character, index) in sheet" :key="index" class="card stack" role="group" :aria-label="`Personnage ${index + 1}`">
                    <label class="stack" style="gap: 6px">
                        <span class="label">Nom</span>
                        <input v-model="character.name" class="input" />
                    </label>
                    <label class="stack" style="gap: 6px">
                        <span class="label">Description</span>
                        <input v-model="character.description" class="input" placeholder="Petit, brun, écharpe rouge" />
                    </label>
                    <button type="button" class="btn btn--white btn--small" :aria-label="`Retirer le personnage ${index + 1}`" @click="sheet.splice(index, 1)">
                        Retirer
                    </button>
                </div>
                <button type="button" class="btn btn--white btn--small" @click="sheet.push({ name: '', description: '' })">Ajouter un personnage</button>
                <p v-if="isBusy" class="muted" role="status">Écriture de l’histoire et des images, cela peut prendre quelques minutes…</p>
                <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
                <button type="button" class="btn btn--block" :disabled="isBusy" @click="generate">
                    {{ isBusy ? 'Génération en cours…' : 'Générer l’histoire' }}
                </button>
                <button type="button" class="btn btn--white btn--small" :disabled="isBusy" @click="step = 'idea'">Retour</button>
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
    return ageMin.value !== null && ageMax.value !== null && ageMin.value > ageMax.value ? 'L’âge minimum doit être inférieur à l’âge maximum.' : ''
})
const skippedLabel = computed(() => {
    const count = result.value?.imagesSkipped ?? 0
    return `${count} ${count > 1 ? 'images n’ont pas pu être créées' : 'image n’a pas pu être créée'} : les pages concernées sont vides. Tu peux les compléter plus tard.`
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
        .map(entry => `${entry.name.trim() || 'Personnage'} : ${entry.description.trim()}`)
    const suffix = characters.length > 0 ? `\nPersonnages à garder identiques sur toutes les pages :\n${characters.join('\n')}` : ''
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
        errorMessage.value = aiErrorMessage(error)
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
