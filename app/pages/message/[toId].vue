<template>
    <MessageComposer :initial-recipient-id="String(route.params.toId)" :initial-kind="route.query.kind === 'birthday' ? 'BIRTHDAY' : 'NORMAL'" />
</template>

<script setup lang="ts">
definePageMeta({ layout: 'blank' })

const route = useRoute()
</script>
