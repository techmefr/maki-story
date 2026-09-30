<template>
    <div class="stack">
        <p class="muted">
            Photographie chaque page du livre. Ces photos restent privées à la famille et ne sont jamais montrées à l’enfant.
        </p>
        <label class="btn btn--block">
            {{ pages.length === 0 ? 'Prendre une page en photo' : 'Ajouter une page' }}
            <input type="file" accept="image/*" capture="environment" multiple hidden @change="addPhotos" />
        </label>
        <div v-if="isBusy" class="muted">Envoi des photos…</div>
        <div v-if="errorMessage" class="error">{{ errorMessage }}</div>
        <div class="thumbs">
            <div v-for="(page, index) in pages" :key="page.fileId" class="thumb" :style="{ backgroundImage: `url(${page.previewUrl})` }">
                <span class="badge">{{ index + 1 }}</span>
                <button type="button" class="thumb__remove" aria-label="Retirer cette page" @click="removePage(index)">×</button>
            </div>
        </div>
        <button type="button" class="btn btn--block" :disabled="isBusy" @click="emit('next')">
            {{ pages.length === 0 ? 'Continuer sans photo' : 'Suivant' }}
        </button>
    </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{ next: [] }>()

const { pages } = useBookDraft()
const { upload } = useFiles()

const isBusy = ref(false)
const errorMessage = ref('')

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
            pages.value = [...pages.value, { fileId, previewUrl: URL.createObjectURL(blob) }]
        }
    } catch (error) {
        console.error('Une photo n a pas pu être envoyée', error)
        errorMessage.value = 'Une photo n’a pas pu être envoyée. Réessaie.'
    } finally {
        isBusy.value = false
    }
}

const removePage = (index: number): void => {
    pages.value = pages.value.filter((_page, position) => position !== index)
}
</script>

<style scoped>
.thumbs {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
}

.thumb {
    position: relative;
    aspect-ratio: 3 / 4;
    border: 2.5px solid var(--ink);
    border-radius: 12px;
    background-size: cover;
    background-position: center;
    padding: 6px;
}

.thumb__remove {
    position: absolute;
    top: 4px;
    right: 4px;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 2px solid var(--ink);
    background: var(--paper);
    font: 700 18px/1 var(--font-title);
    cursor: pointer;
}
</style>
