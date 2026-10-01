<template>
    <div class="offline stack">
        <div v-if="isBusy(bookId)" class="stack" style="gap: 6px">
            <div class="progress" role="progressbar" :aria-valuenow="percent" aria-valuemin="0" aria-valuemax="100">
                <div class="progress__fill" :style="{ width: `${percent}%` }" />
            </div>
            <span class="muted">Téléchargement {{ current.done }}/{{ current.total }}</span>
        </div>
        <div v-else-if="isDownloaded(bookId)" class="row row--wrap">
            <span class="badge" style="background: #4cd4a8">Disponible hors ligne · {{ sizeLabel }}</span>
            <button type="button" class="btn btn--small btn--white" @click="remove(bookId)">
                <AppIcon name="trash" :size="16" />Retirer le téléchargement
            </button>
        </div>
        <button v-else type="button" class="btn btn--small btn--white" :disabled="!isOnline" @click="download(bookId)">
            <AppIcon name="download" :size="16" />{{ isPartial(bookId) ? 'Reprendre le téléchargement' : 'Télécharger' }}
        </button>
        <p v-if="errors[bookId]" class="error" role="alert">{{ errors[bookId] }}</p>
    </div>
</template>

<script setup lang="ts">
const { bookId } = defineProps<{ bookId: string }>()

const isOnline = useState<boolean>('is-online', () => true)
const { records, progress, errors, bytesOf, isBusy, isDownloaded, isPartial, download, remove, refresh } = useOfflineBooks()

const current = computed(() => progress.value[bookId] ?? { done: 0, total: 1 })
const percent = computed(() => Math.round((current.value.done / current.value.total) * 100))
const sizeLabel = computed(() => formatBytes(records.value[bookId] ? bytesOf(records.value[bookId]) : 0))

onMounted(refresh)
</script>

<style scoped>
.offline {
    gap: 6px;
}
</style>
