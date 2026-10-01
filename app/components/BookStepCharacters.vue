<template>
    <div class="stack">
        <p class="muted">
            Définis chaque personnage une seule fois : tu le retrouveras ensuite en un clic pour chaque réplique. Choisis qui lit sa voix.
        </p>
        <div v-for="character in characters" :key="character.key" class="card stack" role="group" :aria-label="`Personnage ${character.name}`">
            <div class="row">
                <label class="stack grow" style="gap: 4px">
                    <span class="label">Nom</span>
                    <input class="input" :value="character.name" @input="updateCharacter(character.key, { name: ($event.target as HTMLInputElement).value })" />
                </label>
                <button
                    type="button"
                    class="btn btn--small btn--white"
                    :disabled="isCharacterUsed(character.key)"
                    :aria-label="`Retirer ${character.name}`"
                    @click="removeCharacter(character.key)"
                >
                    ×
                </button>
            </div>
            <div class="row row--wrap" role="group" aria-label="Couleur">
                <button
                    v-for="color in VOICE_COLORS"
                    :key="color.id"
                    type="button"
                    class="swatch"
                    :class="{ 'swatch--on': character.color === color.id }"
                    :style="{ background: color.hex }"
                    :aria-pressed="character.color === color.id"
                    :aria-label="`Couleur ${COLOR_LABELS[color.id]}`"
                    @click="updateCharacter(character.key, { color: color.id })"
                />
            </div>
            <label class="stack" style="gap: 4px">
                <span class="label">Description (facultatif)</span>
                <input
                    class="input"
                    :value="character.description"
                    placeholder="Un petit zébu timide"
                    @input="updateCharacter(character.key, { description: ($event.target as HTMLInputElement).value })"
                />
            </label>
            <button
                type="button"
                class="chip"
                :class="{ 'chip--on': character.isNarrator }"
                :aria-pressed="character.isNarrator"
                @click="setNarrator(character.key)"
            >
                Narrateur
            </button>
            <div class="stack" style="gap: 6px">
                <span class="label">Qui lit sa voix ?</span>
                <MemberPicker :model-value="character.memberId" @update:model-value="updateCharacter(character.key, { memberId: $event })" />
            </div>
        </div>
        <form class="row" @submit.prevent="add">
            <label class="stack grow" style="gap: 4px">
                <span class="label">Nouveau personnage</span>
                <input v-model="newName" class="input" placeholder="Petit Zébu" />
            </label>
            <button type="submit" class="btn btn--white" :disabled="newName.trim() === ''">Ajouter un personnage</button>
        </form>
        <div class="muted" role="status">{{ castHint }}</div>
        <button type="button" class="btn btn--block" @click="emit('next')">Suivant</button>
    </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{ next: [] }>()

const COLOR_LABELS: Record<VoiceColorId, string> = {
    coral: 'corail',
    sun: 'soleil',
    mint: 'menthe',
    sky: 'ciel',
    grape: 'raisin',
    pink: 'rose',
}

const { characters, addCharacter, updateCharacter, setNarrator, removeCharacter, isCharacterUsed } = useBookDraft()

const newName = ref('')

const castHint = computed(() => {
    const done = characters.value.filter(character => character.memberId !== null).length
    return `${done}/${characters.value.length} personnages ont une voix.`
})

const add = (): void => {
    addCharacter(newName.value)
    newName.value = ''
}
</script>
