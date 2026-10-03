<template>
    <OnboardingSlides @done="start" />
</template>

<script setup lang="ts">
definePageMeta({ layout: 'blank' })

const start = async (): Promise<void> => {
    await navigateTo('/login')
}
</script>
