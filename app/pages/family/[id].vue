<template>
    <div class="stack narrow">
        <NuxtLink to="/family" class="muted">Retour</NuxtLink>
        <h1 class="title">Modifier</h1>
        <MemberForm v-if="member && !member.isGuest" :member="member" @saved="done" />
        <h2 v-else-if="member" class="subtitle">{{ member.name }}</h2>
        <MemberVoiceStatus v-if="member && member.role === 'relative' && current?.role === 'parent'" :member-id="member.id" />
        <p v-else class="muted">Ce proche n’existe plus.</p>
    </div>
</template>

<script setup lang="ts">
const route = useRoute()
const { getById } = useMembers()
const { current } = useCurrentMember()

const member = ref(getById(String(route.params.id)))

const done = async (): Promise<void> => {
    await navigateTo('/family')
}
</script>
