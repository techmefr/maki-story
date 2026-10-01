<template>
    <div class="stack">
        <p class="muted">
            Photographie chaque page du livre. Ces photos restent privées à la famille et ne sont jamais montrées à l’enfant.
        </p>
        <label class="btn btn--block">
            {{ pages.length === 0 ? 'Prendre une page en photo' : 'Ajouter une page' }}
            <input type="file" accept="image/*" capture="environment" multiple hidden @change="addPhotos" />
        </label>
        <button v-if="!isWordless" type="button" class="btn btn--white btn--block" @click="addEmptyPage">Ajouter une page vide</button>
        <div v-if="isBusy" class="muted" role="status">Envoi des photos…</div>
        <div v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</div>
        <div v-for="(page, index) in pages" :key="page.key" class="card stack" :aria-label="`Page ${index + 1}`" role="group">
            <div class="row" style="justify-content: space-between">
                <span class="subtitle">Page {{ index + 1 }}</span>
                <span v-if="page.kind === 'cover'" class="badge">Couverture</span>
                <span v-else-if="page.kind === 'empty'" class="badge">Page vide</span>
                <button type="button" class="btn btn--small btn--white" :aria-label="`Retirer la page ${index + 1}`" @click="removePage(index)">×</button>
            </div>
            <div v-if="page.previewUrl" class="thumb" :style="{ backgroundImage: `url(${page.previewUrl})` }" />
            <template v-if="page.kind === 'empty'">
                <p class="muted">Cette page n’a pas d’image : elle sera passée à l’écoute.</p>
                <label class="row">
                    <input
                        type="checkbox"
                        class="check"
                        :checked="page.ttsFallback"
                        @change="updatePage(index, { ttsFallback: ($event.target as HTMLInputElement).checked })"
                    />
                    <span>Voix de synthèse si personne ne la lit</span>
                </label>
            </template>
            <template v-else>
                <button type="button" class="chip" :class="{ 'chip--on': page.kind === 'cover' }" :aria-pressed="page.kind === 'cover'" @click="toggleCover(index)">
                    Couverture
                </button>
                <label class="stack" style="gap: 6px">
                    <span class="label">Décris l’image de la page (facultatif)</span>
                    <input
                        class="input"
                        :value="page.description"
                        placeholder="Un petit zébu au bord d’un lac…"
                        @input="updatePage(index, { description: ($event.target as HTMLInputElement).value })"
                    />
                </label>
                <div v-if="isComic" class="stack">
                    <div v-for="(panel, panelIndex) in page.panels" :key="panel.key" class="row">
                        <label class="stack grow" style="gap: 4px">
                            <span class="label">Case {{ panelIndex + 1 }}</span>
                            <input
                                class="input"
                                :value="panel.description"
                                placeholder="Ce qu’on voit dans la case"
                                @input="updatePanel(index, panelIndex, ($event.target as HTMLInputElement).value)"
                            />
                        </label>
                        <button
                            type="button"
                            class="btn btn--small btn--white"
                            :aria-label="`Retirer la case ${panelIndex + 1} de la page ${index + 1}`"
                            @click="removePanel(index, panelIndex)"
                        >
                            ×
                        </button>
                    </div>
                    <button type="button" class="btn btn--white btn--small" @click="addPanel(index)">Ajouter une case</button>
                </div>
            </template>
        </div>
        <div v-if="needsPhoto" class="muted">Ce type de livre a besoin d’au moins une page en photo.</div>
        <button type="button" class="btn btn--block" :disabled="isBusy || needsPhoto" @click="emit('next')">
            {{ pages.length === 0 && !needsPhoto ? 'Continuer sans photo' : 'Suivant' }}
        </button>
    </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{ next: [] }>()

const { pages, isComic, isWordless, addPhoto, addEmptyPage, updatePage, removePage, addPanel, updatePanel, removePanel } = useBookDraft()
const { upload } = useFiles()

const isBusy = ref(false)
const errorMessage = ref('')

const hasPhoto = computed(() => pages.value.some(page => page.fileId !== null))
const needsPhoto = computed(() => (isComic.value || isWordless.value) && !hasPhoto.value)

const addPhotos = async (event: Event): Promise<void> => {
    const input = event.target as HTMLInputElement
    const files = Array.from(input.files ?? [])
    input.value = ''
    isBusy.value = true
    errorMessage.value = ''
    try {
        for (const file of files) {
            const blob = await compressImage(file)
            const fileId = await upload(blob, 'image/jpeg')
            addPhoto(fileId, URL.createObjectURL(blob))
        }
    } catch (error) {
        console.error('Une photo n a pas pu être envoyée', error)
        errorMessage.value = 'Une photo n’a pas pu être envoyée. Réessaie.'
    } finally {
        isBusy.value = false
    }
}

const toggleCover = (index: number): void => {
    const isCover = pages.value[index]?.kind === 'cover'
    pages.value.forEach((page, position) => {
        if (page.kind === 'empty') {
            return
        }
        updatePage(position, { kind: position === index && !isCover ? 'cover' : 'content' })
    })
}
</script>

<style scoped>
.thumb {
    aspect-ratio: 4 / 3;
    max-height: 180px;
    width: 100%;
    border: 2.5px solid var(--ink);
    border-radius: 12px;
    background-size: cover;
    background-position: center;
}

.check {
    width: 24px;
    height: 24px;
    accent-color: var(--ink);
    flex-shrink: 0;
}
</style>
