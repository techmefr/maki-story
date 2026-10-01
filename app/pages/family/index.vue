<template>
    <div class="stack">
        <h1 class="title">Ma famille</h1>
        <div class="grid grid--people">
        <NuxtLink
            v-for="(member, index) in people"
            :key="member.id"
            :to="`/family/${member.id}`"
            class="card card--tap row pop-in"
            :style="{ '--i': index }"
            style="color: inherit; text-decoration: none"
        >
            <AppAvatar :member="member" :size="56" />
            <div class="grow">
                <div class="subtitle">{{ member.name }}</div>
                <div class="muted">{{ roleLabel(member.role) }}{{ statusSuffix(member) }}</div>
            </div>
            <span class="badge">Modifier</span>
        </NuxtLink>
        </div>
        <template v-if="guests.length > 0">
            <h2 class="subtitle">Voix invitées</h2>
            <p class="muted">Proches d’autres familles qui ont enregistré des répliques pour toi.</p>
            <NuxtLink v-for="member in guests" :key="member.id" :to="`/family/${member.id}`" class="card card--tap row" style="color: inherit; text-decoration: none">
                <AppAvatar :member="member" :size="48" />
                <div class="grow">
                    <div class="subtitle">{{ member.name }}</div>
                    <div class="muted">Voix invitée{{ statusSuffix(member) }}</div>
                </div>
                <span class="badge">Gérer</span>
            </NuxtLink>
        </template>
        <NuxtLink to="/family/add" class="btn btn--block"><AppIcon name="user-plus" :size="22" />Ajouter un proche</NuxtLink>
        <NuxtLink to="/storage" class="btn btn--white btn--block"><AppIcon name="download" :size="22" />Stockage hors ligne</NuxtLink>
        <NuxtLink to="/sharing" class="btn btn--white btn--block"><AppIcon name="send" :size="22" />Partage entre familles</NuxtLink>
        <NuxtLink to="/family/devices" class="btn btn--white btn--block">Appareils</NuxtLink>
        <NuxtLink to="/feedback" class="btn btn--white btn--block">Avis des testeurs</NuxtLink>
    </div>
</template>

<script setup lang="ts">
const { people, guests } = useMembers()

const STATUS_SUFFIXES: Partial<Record<MemberStatus, string>> = {
    blocked: ' · bloqué',
    left: ' · a quitté le foyer',
    deceased: ' · décédé',
}

const statusSuffix = (member: IMember): string => STATUS_SUFFIXES[member.status] ?? ''
</script>
