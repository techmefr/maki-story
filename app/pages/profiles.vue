<template>
    <div class="stack narrow">
        <div class="row" style="justify-content: space-between">
            <AppMaki :size="48" />
            <button type="button" class="btn btn--small btn--white" @click="leave">Se déconnecter</button>
        </div>
        <h1 class="title">Qui écoute ?</h1>
        <button
            v-for="(member, index) in members"
            :key="member.id"
            type="button"
            class="card card--tap row pop-in"
            :style="{ '--i': index }"
            @click="choose(member)"
        >
            <AppAvatar :member="member" :size="60" />
            <div class="grow">
                <div class="subtitle">{{ member.name }}</div>
                <div class="muted">{{ roleLabel(member.role) }}</div>
            </div>
        </button>
        <NuxtLink to="/family/add" class="btn btn--white btn--block">Ajouter un proche</NuxtLink>
    </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'blank' })

const { members } = useMembers()
const { select } = useCurrentMember()
const { logout } = useSession()

const choose = async (member: IMember): Promise<void> => {
    await select(member.id)
    await navigateTo(member.role === 'child' ? '/kid' : '/home')
}

const leave = async (): Promise<void> => {
    await select(null)
    await logout()
}
</script>
