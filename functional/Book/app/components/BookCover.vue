<template>
    <div class="cover" :style="{ background: fallback }">
        <img v-if="imageSrc" :src="imageSrc" alt="" class="cover__image" />
        <AppIcon v-else name="book" :size="48" />
    </div>
</template>

<script setup lang="ts">
const { fileId = null, src = null, fallback = 'var(--sky)' } = defineProps<{ fileId?: string | null; src?: string | null; fallback?: string }>()

const { fetchUrl } = useFiles()
const url = ref('')
const imageSrc = computed<string>(() => url.value || src || '')

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
    color: var(--on-accent);
}

.cover__image {
    width: 100%;
    height: 100%;
    object-fit: cover;
}
</style>
