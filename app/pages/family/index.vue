<template>
    <div class="stack">
        <h1 class="title">Ma famille</h1>
        <NuxtLink
            v-for="member in members"
            :key="member.id"
            :to="`/family/${member.id}`"
            class="card card--tap row"
            style="color: inherit; text-decoration: none"
        >
            <AppAvatar :member="member" :size="56" />
            <div class="grow">
                <div class="subtitle">{{ member.name }}</div>
                <div class="muted">{{ roleLabel(member.role) }}</div>
            </div>
            <span class="badge">Modifier</span>
        </NuxtLink>
        <NuxtLink to="/family/add" class="btn btn--block">Ajouter un proche</NuxtLink>
        <NuxtLink to="/feedback" class="btn btn--white btn--block">Avis des testeurs</NuxtLink>
    </div>
</template>

<script setup lang="ts">
const { members } = useMembers()
</script>
