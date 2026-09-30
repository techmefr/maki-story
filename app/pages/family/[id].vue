<template>
    <div class="stack">
        <NuxtLink to="/family" class="muted">Retour</NuxtLink>
        <h1 class="title">Modifier</h1>
        <MemberForm v-if="member" :member="member" @saved="done" />
        <p v-else class="muted">Ce proche n’existe plus.</p>
    </div>
</template>

<script setup lang="ts">
const route = useRoute()
const { getById } = useMembers()

const member = computed(() => getById(String(route.params.id)))

const done = async (): Promise<void> => {
    await navigateTo('/family')
}
</script>
