<template>
    <div class="stack">
        <label class="stack" style="gap: 6px">
            <span class="label">Titre du livre</span>
            <input v-model="title" class="input" placeholder="Le Zébu qui voulait voler" />
        </label>
        <fieldset class="stack fieldset">
            <legend class="label">Type de livre</legend>
            <div class="row row--wrap">
                <button
                    v-for="option in TYPE_OPTIONS"
                    :key="option.id"
                    type="button"
                    class="chip"
                    :class="{ 'chip--on': type === option.id }"
                    :aria-pressed="type === option.id"
                    @click="type = option.id"
                >
                    {{ option.label }}
                </button>
            </div>
            <p class="muted">{{ typeHint }}</p>
        </fieldset>
        <label class="stack" style="gap: 6px">
            <span class="label">Langue du livre</span>
            <select v-model="language" class="input">
                <option v-for="item in LANGUAGES" :key="item.code" :value="item.code">{{ item.flag }} {{ item.label }}</option>
            </select>
        </label>
        <div v-if="isSimple && !isWordless" class="card stack">
            <span class="subtitle">Qui lit tout le livre ?</span>
            <MemberPicker :model-value="readerId" @update:model-value="setReader" />
        </div>
        <details class="card stack">
            <summary class="subtitle">Plus de détails (facultatif)</summary>
            <div class="stack" style="margin-top: 12px">
                <label class="stack" style="gap: 6px">
                    <span class="label">Sous-titre</span>
                    <input v-model="subtitle" class="input" />
                </label>
                <label class="stack" style="gap: 6px">
                    <span class="label">{{ type === 'child-written' ? 'Auteur (l’enfant)' : 'Auteur' }}</span>
                    <input v-model="author" class="input" />
                </label>
                <div class="row">
                    <label class="stack grow" style="gap: 6px">
                        <span class="label">Âge minimum</span>
                        <input v-model.number="ageMin" class="input" type="number" min="0" max="18" inputmode="numeric" />
                    </label>
                    <label class="stack grow" style="gap: 6px">
                        <span class="label">Âge maximum</span>
                        <input v-model.number="ageMax" class="input" type="number" min="0" max="18" inputmode="numeric" />
                    </label>
                </div>
                <label class="row">
                    <input v-model="ttsFallback" type="checkbox" class="check" />
                    <span>Lire le titre avec une voix de synthèse tant qu’il n’est pas enregistré</span>
                </label>
            </div>
        </details>
        <div v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</div>
        <button type="button" class="btn btn--block" @click="goNext">Suivant</button>
    </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{ next: [] }>()

const TYPE_OPTIONS: { id: BookType; label: string; hint: string }[] = [
    { id: 'standard', label: 'Livre', hint: 'Un livre illustré classique, lu page par page.' },
    { id: 'comic', label: 'Bande dessinée', hint: 'Des cases par page, chacune avec ses répliques dans l’ordre.' },
    { id: 'wordless', label: 'Sans texte', hint: 'Des images seulement : pas de répliques à enregistrer.' },
    { id: 'child-written', label: 'Écrit par l’enfant', hint: 'Recopie les phrases de l’enfant telles qu’il les a écrites.' },
]

const { title, subtitle, author, ageMin, ageMax, language, type, ttsFallback, readerId, isSimple, isWordless, setReader } = useBookDraft()

const errorMessage = ref('')
const typeHint = computed(() => TYPE_OPTIONS.find(option => option.id === type.value)?.hint ?? '')

const goNext = (): void => {
    errorMessage.value = ''
    if (title.value.trim() === '') {
        errorMessage.value = 'Donne un titre au livre.'
        return
    }
    if (isSimple.value && !isWordless.value && readerId.value === null) {
        errorMessage.value = 'Choisis qui lit le livre.'
        return
    }
    if (ageMin.value !== null && ageMax.value !== null && ageMin.value > ageMax.value) {
        errorMessage.value = 'L’âge minimum doit être inférieur à l’âge maximum.'
        return
    }
    emit('next')
}
</script>

<style scoped>
.fieldset {
    border: 0;
    padding: 0;
    margin: 0;
}

.check {
    width: 24px;
    height: 24px;
    accent-color: var(--ink);
    flex-shrink: 0;
}
</style>
