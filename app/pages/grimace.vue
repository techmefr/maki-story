<template>
    <div class="stack center narrow">
        <h1 class="title">Ta grimace !</h1>
        <p class="muted">Fais une grimace que personne d’autre ne fait : l’enfant te reconnaîtra tout de suite.</p>
        <PhotoCapture :frame-color="hex" @captured="onCaptured" />
        <NuxtLink :to="homePath" class="btn btn--white btn--small">Plus tard</NuxtLink>
        <div v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</div>
    </div>
</template>

<script setup lang="ts">
const { current, homePath } = useCurrentMember()
const { update } = useMembers()
const { upload } = useFiles()
const { register } = useMemberPhotos()

const errorMessage = ref('')
const hex = computed(() => memberHex(current.value))

const onCaptured = async (blob: Blob): Promise<void> => {
    if (!current.value) {
        return
    }
    try {
        const fileId = await upload(blob, blob.type)
        register(fileId, URL.createObjectURL(blob))
        await update(current.value.id, { photoFileId: fileId })
        await navigateTo(homePath.value)
    } catch (error) {
        console.error('La grimace n a pas pu être enregistrée', error)
        errorMessage.value = 'Impossible d’enregistrer la photo pour le moment.'
    }
}
</script>
