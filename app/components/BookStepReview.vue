<template>
    <div class="stack">
        <label class="stack" style="gap: 6px">
            <span class="label">Titre du livre</span>
            <input v-model="title" class="input" placeholder="Le Zébu qui voulait voler" />
        </label>
        <div class="card stack" style="gap: 6px">
            <div class="row" style="justify-content: space-between">
                <span class="subtitle">{{ pages.length }} {{ pages.length > 1 ? 'pages' : 'page' }}</span>
                <span class="subtitle">{{ lines.length }} répliques</span>
            </div>
            <div v-for="member in cast" :key="member.id" class="row">
                <AppAvatar :member="member" :size="36" />
                <div class="grow">
                    <div class="label">{{ member.name }}</div>
                    <div class="muted">{{ charactersOf(member.id) }}</div>
                </div>
                <span class="badge">{{ countOf(member.id) }}</span>
            </div>
        </div>
        <div v-if="errorMessage" class="error">{{ errorMessage }}</div>
        <button type="button" class="btn btn--block" :disabled="title.trim() === '' || isBusy" @click="save">
            {{ isBusy ? 'Enregistrement…' : 'Passer au studio' }}
        </button>
    </div>
</template>

<script setup lang="ts">
const { title, pages, lines, kind, soloMemberId, imageDesc, tones, castMemberIds, reset } = useBookDraft()
const { getById } = useMembers()
const { create, get, patch } = useBooks()

const isBusy = ref(false)
const errorMessage = ref('')

const cast = computed(() =>
    castMemberIds.value.map(id => getById(id)).filter((member): member is IMember => member !== null),
)

const countOf = (memberId: string): number => lines.value.filter(line => line.memberId === memberId).length
const charactersOf = (memberId: string): string => {
    const names = lines.value.filter(line => line.memberId === memberId && line.character !== '').map(line => line.character)
    return [...new Set(names)].join(', ')
}

const save = async (): Promise<void> => {
    isBusy.value = true
    errorMessage.value = ''
    try {
        const created = await create({
            title: title.value,
            kind: kind.value,
            soloMemberId: soloMemberId.value,
            imageDesc: imageDesc.value,
            pageFileIds: pages.value.map(page => page.fileId),
            lines: lines.value.map(line => ({ pageIndex: line.pageIndex, character: line.character, text: line.text })),
        })
        const book = await get(created.id)
        const linePatches = book.lines.map((saved, index) => ({
            id: saved.id,
            memberId: lines.value[index]?.memberId ?? null,
            note: lines.value[index]?.note ?? '',
        }))
        await patch(created.id, { lines: linePatches, tones: tones.value })
        reset(kind.value, soloMemberId.value)
        await navigateTo(`/books/${created.id}/studio`)
    } catch (error) {
        console.error('Le livre n a pas pu être enregistré', error)
        errorMessage.value = 'Impossible d’enregistrer le livre pour le moment.'
    } finally {
        isBusy.value = false
    }
}
</script>
