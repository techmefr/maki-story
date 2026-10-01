<template>
    <form class="stack composer" @submit.prevent="add">
        <div v-if="!isSimple" class="stack" style="gap: 8px">
            <span class="label">Qui parle ?</span>
            <div class="row row--wrap" role="group" aria-label="Personnage">
                <button
                    v-for="character in characters"
                    :key="character.key"
                    type="button"
                    class="chip"
                    :class="{ 'chip--on': selectedKey === character.key }"
                    :aria-pressed="selectedKey === character.key"
                    @click="selectedKey = character.key"
                >
                    {{ character.name }}
                </button>
                <button v-if="!isCreating" type="button" class="chip" @click="isCreating = true">+ Nouveau</button>
            </div>
            <div v-if="isCreating" class="row">
                <input
                    v-model="newName"
                    class="input grow"
                    aria-label="Nom du nouveau personnage"
                    placeholder="Nom du personnage"
                    @keydown.enter.prevent="createCharacter"
                />
                <button type="button" class="btn btn--small" :disabled="newName.trim() === ''" @click="createCharacter">Créer</button>
            </div>
            <div v-if="selected && selected.memberId === null" class="stack" style="gap: 6px">
                <span class="label">Qui lit la voix de {{ selected.name }} ?</span>
                <MemberPicker :model-value="selected.memberId" @update:model-value="updateCharacter(selected.key, { memberId: $event })" />
            </div>
        </div>
        <div v-if="panels.length > 0" class="stack" style="gap: 8px">
            <span class="label">Dans quelle case ?</span>
            <div class="row row--wrap" role="group" aria-label="Case">
                <button
                    v-for="(_panel, index) in panels"
                    :key="index"
                    type="button"
                    class="chip"
                    :class="{ 'chip--on': panelIndex === index }"
                    :aria-pressed="panelIndex === index"
                    @click="panelIndex = index"
                >
                    Case {{ index + 1 }}
                </button>
            </div>
        </div>
        <label class="stack" style="gap: 6px">
            <span class="label">Texte</span>
            <textarea
                v-model="text"
                class="input"
                :placeholder="isSimple ? 'Ce que lit la voix (une réplique par ligne)' : 'Ce que dit le personnage (une réplique par ligne)'"
                @keydown.ctrl.enter.prevent="add"
                @keydown.meta.enter.prevent="add"
            />
        </label>
        <ToneChips v-model="tone" />
        <label class="stack" style="gap: 6px">
            <span class="label">Décris la scène (facultatif)</span>
            <input v-model="sceneDescription" class="input" placeholder="Il pleut sur le lac" />
        </label>
        <div v-if="parsedCount > 1" class="muted" role="status">{{ parsedCount }} répliques seront ajoutées.</div>
        <button type="submit" class="btn" :disabled="parsedCount === 0">Ajouter</button>
    </form>
</template>

<script setup lang="ts">
const props = defineProps<{ pageIndex: number; panels: IDraftPanel[] }>()

const { characters, narrator, isSimple, addCharacter, updateCharacter, addLines } = useBookDraft()

const selectedKey = ref<number | null>(narrator.value?.key ?? null)
const panelIndex = ref<number | null>(props.panels.length > 0 ? 0 : null)
const text = ref('')
const tone = ref('')
const sceneDescription = ref('')
const isCreating = ref(false)
const newName = ref('')

const selected = computed(() => characters.value.find(character => character.key === selectedKey.value) ?? null)

const parseLine = (raw: string): { characterKey: number | null; text: string } => {
    const match = /^([^:]{1,40}?)\s*:\s*(.+)$/.exec(raw)
    const named = match ? characters.value.find(character => character.name.toLowerCase() === match[1]!.trim().toLowerCase()) : undefined
    if (isSimple.value || !named) {
        return { characterKey: selectedKey.value, text: raw }
    }
    return { characterKey: named.key, text: match![2]! }
}

const parsed = computed(() =>
    text.value
        .split('\n')
        .map(raw => raw.trim())
        .filter(raw => raw !== '')
        .map(parseLine),
)
const parsedCount = computed(() => parsed.value.length)

watch(
    () => props.panels.length,
    count => {
        if (count === 0) {
            panelIndex.value = null
        } else if (panelIndex.value === null || panelIndex.value >= count) {
            panelIndex.value = count - 1
        }
    },
)

const createCharacter = (): void => {
    if (newName.value.trim() === '') {
        return
    }
    selectedKey.value = addCharacter(newName.value).key
    newName.value = ''
    isCreating.value = false
}

const add = (): void => {
    if (parsedCount.value === 0) {
        return
    }
    parsed.value.forEach(item => {
        addLines({
            pageIndex: props.pageIndex,
            panelIndex: panelIndex.value,
            characterKey: item.characterKey,
            texts: [item.text],
            tone: tone.value,
            sceneDescription: sceneDescription.value,
        })
    })
    text.value = ''
    sceneDescription.value = ''
    tone.value = ''
}
</script>

<style scoped>
.composer {
    border-top: 2px dashed var(--ink);
    padding-top: 12px;
}
</style>
