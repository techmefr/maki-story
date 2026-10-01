<template>
    <div class="stack">
        <div class="card stack" style="gap: 6px">
            <div class="subtitle">{{ title }}</div>
            <div class="muted">{{ typeLabel }} · {{ languageLabel(language) }}</div>
            <div class="row" style="justify-content: space-between">
                <span class="subtitle">{{ pages.length }} {{ pages.length > 1 ? 'pages' : 'page' }}</span>
                <span class="subtitle">{{ isWordless ? 'Sans texte' : `${lines.length} répliques` }}</span>
            </div>
            <template v-if="isSimple">
                <div v-if="reader && !isWordless" class="row">
                    <AppAvatar :member="reader" :size="36" />
                    <div class="grow label">{{ reader.name }} lit tout le livre</div>
                </div>
            </template>
            <template v-else-if="!isWordless">
                <div v-for="character in usedCharacters" :key="character.key" class="row">
                    <AppAvatar :member="getById(character.memberId)" :size="36" />
                    <div class="grow">
                        <div class="label">{{ character.name }}{{ character.isNarrator ? ' (narrateur)' : '' }}</div>
                        <div class="muted">{{ getById(character.memberId)?.name ?? 'Voix à choisir' }}</div>
                    </div>
                    <span class="badge">{{ countOf(character.key) }}</span>
                </div>
            </template>
        </div>
        <div v-if="problem" class="error" role="alert">{{ problem }}</div>
        <div v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</div>
        <button type="button" class="btn btn--block" :disabled="problem !== '' || isBusy" @click="save">
            {{ isBusy ? 'Enregistrement…' : 'Passer au studio' }}
        </button>
    </div>
</template>

<script setup lang="ts">
const TYPE_LABELS: Record<BookType, string> = {
    standard: 'Livre',
    comic: 'Bande dessinée',
    wordless: 'Sans texte',
    'child-written': 'Écrit par l’enfant',
}

const {
    title,
    language,
    type,
    pages,
    lines,
    isSimple,
    isWordless,
    readerId,
    characters,
    usedCharacters,
    voicelessCharacters,
    effectiveCharacterKey,
    toNewBook,
    memberIdsForSave,
    translationsForSave,
    reset,
} = useBookDraft()
const { saveTranslation } = useAi()
const { getById } = useMembers()
const { create, get, patch } = useBooks()

const isBusy = ref(false)
const errorMessage = ref('')

const reader = computed(() => getById(readerId.value))
const typeLabel = computed(() => TYPE_LABELS[type.value])
const countOf = (key: number): number => lines.value.filter(line => effectiveCharacterKey(line) === key).length

const problem = computed(() => {
    if (title.value.trim() === '') {
        return 'Donne un titre au livre.'
    }
    if (!isWordless.value && lines.value.length === 0) {
        return 'Ajoute au moins une réplique.'
    }
    if (!isSimple.value && !isWordless.value) {
        const names = characters.value.map(character => character.name.trim().toLowerCase())
        if (names.some(name => name === '') || new Set(names).size !== names.length) {
            return 'Chaque personnage a besoin d’un nom différent.'
        }
        if (voicelessCharacters.value.length > 0) {
            return `Choisis une voix pour : ${voicelessCharacters.value.map(character => character.name).join(', ')}.`
        }
    }
    return ''
})

const save = async (): Promise<void> => {
    isBusy.value = true
    errorMessage.value = ''
    try {
        const created = await create(toNewBook())
        const translations = translationsForSave()
        const hasTranslations = translations.some(list => list.length > 0)
        if ((!isSimple.value && !isWordless.value) || hasTranslations) {
            const book = await get(created.id)
            if (!isSimple.value && !isWordless.value) {
                const memberIds = memberIdsForSave()
                await patch(created.id, { lines: book.lines.map((saved, index) => ({ id: saved.id, memberId: memberIds[index] ?? null })) })
            }
            for (const [index, saved] of book.lines.entries()) {
                for (const item of translations[index] ?? []) {
                    await saveTranslation(created.id, saved.id, item.language, item.text, item.tone)
                }
            }
        }
        reset(isSimple.value ? 'simple' : 'casting', readerId.value)
        await navigateTo(`/books/${created.id}/studio`)
    } catch (error) {
        console.error('Le livre n a pas pu être enregistré', error)
        errorMessage.value = 'Impossible d’enregistrer le livre pour le moment.'
    } finally {
        isBusy.value = false
    }
}
</script>
