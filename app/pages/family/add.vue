<template>
    <div class="stack">
        <NuxtLink to="/family" class="muted">Retour</NuxtLink>
        <h1 class="title">Ajouter un proche</h1>
        <MemberForm @saved="done" />
    </div>
</template>

<script setup lang="ts">
const done = async (): Promise<void> => {
    await navigateTo('/family')
}
</script>
