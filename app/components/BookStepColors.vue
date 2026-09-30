<template>
    <div class="stack">
        <label class="stack" style="gap: 6px">
            <span class="label">Décris l’image de la page (facultatif)</span>
            <textarea v-model="imageDesc" class="input" placeholder="Un petit zébu au bord d’un lac…" />
        </label>
        <div class="row">
            <button type="button" class="chip" :class="{ 'chip--on': !isByLine }" @click="isByLine = false">
                Par personnage
            </button>
            <button type="button" class="chip" :class="{ 'chip--on': isByLine }" @click="isByLine = true">
                Par réplique
            </button>
        </div>
        <div class="muted">{{ castHint }}</div>
        <template v-if="!isByLine">
            <div v-for="name in characters" :key="name" class="card stack" style="gap: 8px">
                <div class="subtitle">{{ name }}</div>
                <MemberPicker :model-value="memberOfCharacter(name)" @update:model-value="castCharacter(name, $event)" />
            </div>
        </template>
        <template v-else>
            <div v-for="line in lines" :key="line.key" class="card stack" style="gap: 8px">
                <div class="label">{{ line.character || 'Narrateur' }}</div>
                <div>{{ line.text }}</div>
                <MemberPicker :model-value="line.memberId" @update:model-value="castLine(line.key, $event)" />
            </div>
        </template>
        <div v-if="castMembers.length > 0" class="card stack">
            <div class="subtitle">Le ton de chaque voix</div>
            <label v-for="member in castMembers" :key="member.id" class="stack" style="gap: 6px">
                <span class="row">
                    <AppAvatar :member="member" :size="28" />
                    <span class="label">{{ member.name }}</span>
                </span>
                <input v-model="tones[member.id]" class="input" placeholder="Douce, grave, joyeuse…" />
            </label>
        </div>
        <div class="card stack">
            <div class="subtitle">Une indication par phrase (facultatif)</div>
            <label v-for="line in lines" :key="line.key" class="stack" style="gap: 4px">
                <span class="muted">{{ line.text }}</span>
                <input
                    class="input"
                    :value="line.note"
                    placeholder="chuchoté, en riant…"
                    @input="setNote(line.key, ($event.target as HTMLInputElement).value)"
                />
            </label>
        </div>
        <button type="button" class="btn btn--block" :disabled="!isFullyCast" @click="emit('next')">
            {{ isFullyCast ? 'Suivant' : `Encore ${uncastCount} répliques à colorier` }}
        </button>
    </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{ next: [] }>()

const {
    lines,
    imageDesc,
    tones,
    isByLine,
    characters,
    isFullyCast,
    uncastCount,
    castMemberIds,
    castCharacter,
    castLine,
    setNote,
    memberOfCharacter,
} = useBookDraft()
const { getById } = useMembers()

const castMembers = computed(() =>
    castMemberIds.value.map(id => getById(id)).filter((member): member is IMember => member !== null),
)

const castHint = computed(() => {
    const done = characters.value.filter(name => memberOfCharacter(name) !== null).length
    return `${done}/${characters.value.length} personnages ont une voix.`
})
</script>
