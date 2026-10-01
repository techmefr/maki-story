<template>
    <NuxtLink v-if="isMissing" to="/grimace" class="card card--tap row nudge" :style="{ background: hex }">
        <AppAvatar :member="current" :size="56" />
        <div class="grow">
            <div class="subtitle">{{ t('home.grimaceNudge.title') }}</div>
            <div class="muted">{{ t('home.grimaceNudge.text') }}</div>
        </div>
    </NuxtLink>
</template>

<script setup lang="ts">
const { t } = useI18n()
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
