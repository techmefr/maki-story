<template>
    <div class="stack narrow">
        <NuxtLink to="/family" class="muted">Retour</NuxtLink>
        <h1 class="title">Stockage hors ligne</h1>
        <div class="card stack">
            <div class="subtitle">{{ usageLabel }}</div>
            <div class="progress" role="progressbar" :aria-valuenow="usedPercent" aria-valuemin="0" aria-valuemax="100">
                <div class="progress__fill" :style="{ width: `${usedPercent}%` }" />
            </div>
            <div class="muted">Livres téléchargés : {{ formatBytes(totalBytes) }}</div>
            <button v-if="!usage.isPersisted" type="button" class="btn btn--small btn--white" @click="keep">Garder les données sur cet appareil</button>
            <span v-else class="badge" style="background: #4cd4a8">Stockage protégé</span>
        </div>
        <p v-if="list.length === 0" class="muted">Aucun livre téléchargé. Télécharge un livre depuis la bibliothèque pour l’écouter sans connexion.</p>
        <div v-for="record in list" :key="record.id" class="card row" data-offline-book>
            <div class="grow">
                <div class="subtitle">{{ record.title }}</div>
                <div class="muted">{{ formatBytes(bytesOf(record)) }}{{ record.isComplete ? '' : ' · incomplet' }}</div>
            </div>
            <button type="button" class="btn btn--small btn--white" :aria-label="`Supprimer ${record.title}`" @click="remove(record.id)">
                <AppIcon name="trash" :size="16" />Supprimer
            </button>
        </div>
        <button v-if="list.length > 0" type="button" class="btn btn--block btn--white" @click="removeAll">Tout supprimer</button>
    </div>
</template>

<script setup lang="ts">
const { list, totalBytes, usage, bytesOf, refresh, remove, removeAll, requestPersistence } = useOfflineBooks()

const usedPercent = computed(() => {
    if (!usage.value.usedBytes || !usage.value.quotaBytes) {
        return 0
    }
    return Math.min(100, Math.max(1, Math.round((usage.value.usedBytes / usage.value.quotaBytes) * 100)))
})
const usageLabel = computed(() =>
    usage.value.usedBytes === null || usage.value.quotaBytes === null
        ? 'Espace utilisé indisponible sur cet appareil'
        : `${formatBytes(usage.value.usedBytes)} utilisés sur ${formatBytes(usage.value.quotaBytes)}`,
)

const keep = async (): Promise<void> => {
    await requestPersistence()
}

onMounted(refresh)
</script>
