<template>
    <NuxtLink :to="target" class="card card--tap book">
        <div class="book__cover" :style="{ background: `repeating-linear-gradient(135deg, ${hex} 0 10px, ${hexLight} 10px 20px)` }">
            <span class="book__kind">{{ kindLabel }}</span>
        </div>
        <div class="grow stack" style="gap: 6px">
            <div class="subtitle">{{ book.title }}</div>
            <div class="row row--wrap">
                <span class="badge" :style="{ background: statusBg }">{{ statusLabel }}</span>
                <VoiceDots :member-ids="book.memberIds" />
            </div>
            <div class="muted">{{ progressLabel }}</div>
        </div>
    </NuxtLink>
</template>

<script setup lang="ts">
const { book } = defineProps<{ book: IBookSummary }>()

const palette = computed(() => pickVoiceByText(book.id))
const hex = computed(() => palette.value.hex)
const hexLight = computed(() => palette.value.hexLight)
const isReady = computed(() => book.status === 'ready')
const target = computed(() => (isReady.value ? `/books/${book.id}/play` : `/books/${book.id}/studio`))
const statusLabel = computed(() => (isReady.value ? 'Prêt' : 'À enregistrer'))
const statusBg = computed(() => (isReady.value ? '#4CD4A8' : '#FFF4D9'))
const kindLabel = computed(() => (book.kind === 'solo' ? '1 voix' : 'Voix'))
const progressLabel = computed(() => `${book.recordedCount}/${book.lineCount} répliques enregistrées`)
</script>

<style scoped>
.book {
    display: flex;
    gap: 14px;
    align-items: center;
    color: inherit;
    text-decoration: none;
}

.book__cover {
    width: 76px;
    height: 96px;
    border: 2.5px solid var(--ink);
    border-radius: 12px;
    flex-shrink: 0;
    display: flex;
    align-items: flex-end;
    padding: 6px;
}

.book__kind {
    font: 700 11px/1 var(--font-title);
    background: var(--paper);
    border: 2px solid var(--ink);
    border-radius: 999px;
    padding: 3px 7px;
}
</style>
