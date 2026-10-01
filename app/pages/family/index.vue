<template>
    <div class="stack">
        <h1 class="title">Ma famille</h1>
        <div class="grid grid--people">
        <NuxtLink
            v-for="(member, index) in members"
            :key="member.id"
            :to="`/family/${member.id}`"
            class="card card--tap row pop-in"
            :style="{ '--i': index }"
            style="color: inherit; text-decoration: none"
        >
            <AppAvatar :member="member" :size="56" />
            <div class="grow">
                <div class="subtitle">{{ member.name }}</div>
                <div class="muted">{{ roleLabel(member.role) }}</div>
            </div>
            <span class="badge">Modifier</span>
        </NuxtLink>
        </div>
        <NuxtLink to="/family/add" class="btn btn--block"><AppIcon name="user-plus" :size="22" />Ajouter un proche</NuxtLink>
        <NuxtLink to="/storage" class="btn btn--white btn--block"><AppIcon name="download" :size="22" />Stockage hors ligne</NuxtLink>
        <NuxtLink to="/family/devices" class="btn btn--white btn--block">Appareils</NuxtLink>
        <NuxtLink to="/feedback" class="btn btn--white btn--block">Avis des testeurs</NuxtLink>
    </div>
</template>

<script setup lang="ts">
const { members } = useMembers()
</script>
