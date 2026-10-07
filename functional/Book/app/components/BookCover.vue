<template>
    <div class="cover" :style="{ background: fallback }">
        <img v-if="url" :src="url" alt="" class="cover__image" />
        <AppIcon v-else name="book" :size="48" />
    </div>
</template>

<script setup lang="ts">
const { fileId = null, fallback = 'var(--sky)' } = defineProps<{ fileId?: string | null; fallback?: string }>()

const { fetchUrl } = useFiles()
const url = ref('')

const load = async (): Promise<void> => {
    url.value = ''
    if (!fileId) {
        return
    }
    try {
        url.value = await fetchUrl(fileId)
    } catch {
        url.value = ''
    }
}

watch(() => fileId, load, { immediate: true })
</script>

<style scoped>
.cover {
    display: grid;
    place-items: center;
    aspect-ratio: 3 / 4;
    overflow: hidden;
    border: var(--outline) solid var(--line);
    border-radius: 16px;
    color: var(--ink);
}

.cover__image {
    width: 100%;
    height: 100%;
    object-fit: cover;
}
</style>
