<template>
    <div class="stack">
        <p class="muted">
            Recopie les répliques, page par page. Colle tout un texte d’un coup : une réplique par ligne
            <template v-if="!isSimple">, ou « Nom : réplique » pour changer de personnage</template>.
            Le texte sert seulement à découper : l’enfant ne le verra jamais.
        </p>
        <div v-for="(page, index) in displayPages" :key="page.key" class="card stack" role="group" :aria-label="`Page ${index + 1}`">
            <div class="row" style="justify-content: space-between">
                <span class="subtitle">Page {{ index + 1 }}</span>
                <span v-if="page.kind === 'cover'" class="badge">Couverture</span>
                <span v-else-if="page.kind === 'empty'" class="badge">Page vide</span>
                <span v-else class="badge">{{ linesOfPage(index).length }} répliques</span>
            </div>
            <p v-if="page.kind === 'empty'" class="muted">Page vide : rien à enregistrer, elle sera passée à l’écoute.</p>
            <template v-else>
                <div v-if="page.description" class="muted">Image : {{ page.description }}</div>
                <div v-for="(panel, panelIndex) in page.panels" :key="panel.key" class="stack panel">
                    <div class="label">Case {{ panelIndex + 1 }}<span v-if="panel.description"> : {{ panel.description }}</span></div>
                    <BookLineRow v-for="line in linesOfPanel(index, panelIndex)" :key="line.key" :line="line" />
                </div>
                <BookLineRow v-for="line in linesOfPanel(index, null)" :key="line.key" :line="line" />
                <BookLineComposer :page-index="index" :panels="page.panels" />
            </template>
        </div>
        <div v-if="!hasLines" class="muted">Ajoute au moins une réplique pour continuer.</div>
        <button type="button" class="btn btn--block" :disabled="!hasLines" @click="emit('next')">Suivant</button>
    </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{ next: [] }>()

const { pages, hasLines, isSimple, linesOfPage, linesOfPanel } = useBookDraft()

const displayPages = computed<IDraftPage[]>(() =>
    pages.value.length > 0
        ? pages.value
        : [{ key: 0, fileId: null, previewUrl: '', kind: 'content', ttsFallback: false, description: '', panels: [] }],
)
</script>

<style scoped>
.panel {
    border-left: 4px solid var(--ink);
    padding-left: 10px;
}
</style>
