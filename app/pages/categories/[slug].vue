<template>
    <RelativeCategory v-if="slug" :slug="slug" />
    <AppEmpty v-else :title="t('errorState.notFound.title')" />
</template>

<script setup lang="ts">
const SLUGS = ['toRecord', 'proposals', 'toFix'] as const

const { t } = useI18n()
const route = useRoute()

const slug = computed(() => SLUGS.find(item => item === route.params.slug) ?? null)
</script>
