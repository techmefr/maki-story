<template>
    <NuxtLink v-if="isMissing" to="/grimace" class="card card--tap row nudge" :style="{ background: hex }">
        <AppAvatar :member="current" :size="56" />
        <div class="grow">
            <div class="subtitle">Fais ta grimace !</div>
            <div class="muted">Une photo rigolote pour que l’enfant te reconnaisse.</div>
        </div>
    </NuxtLink>
</template>

<script setup lang="ts">
const { current } = useCurrentMember()

const isMissing = computed(() => current.value !== null && current.value.photoFileId === null)
const hex = computed(() => memberHexLight(current.value))
</script>

<style scoped>
.nudge {
    color: inherit;
    text-decoration: none;
}
</style>
