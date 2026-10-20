<template>
    <ProfilePhotoPrompt />
</template>

<script setup lang="ts">
definePageMeta({
    middleware: [() => {
        setPageLayout(useCurrentMember().isChild.value ? 'kid' : 'default')
    }],
})
</script>
