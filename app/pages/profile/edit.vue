<template>
    <ProfileEditor />
</template>

<script setup lang="ts">
definePageMeta({ layout: 'blank' })

const { isChild, homePath } = useCurrentMember()

if (isChild.value) {
    await navigateTo(homePath.value, { replace: true })
}
</script>
