<template>
    <div v-if="isOpen" class="sheet-backdrop" @click.self="close">
        <div class="sheet stack">
            <h2 class="subtitle">Qui écoute ?</h2>
            <button
                v-for="member in members"
                :key="member.id"
                type="button"
                class="card card--tap row"
                :style="member.id === currentId ? { outline: '3px solid #1F1B3A', outlineOffset: '3px' } : {}"
                @click="choose(member)"
            >
                <AppAvatar :member="member" :size="52" />
                <div class="grow">
                    <div class="subtitle">{{ member.name }}</div>
                    <div class="muted">{{ roleLabel(member.role) }}</div>
                </div>
            </button>
            <NuxtLink to="/family" class="btn btn--white btn--block" @click="close">Gérer la famille</NuxtLink>
            <button type="button" class="btn btn--white btn--block" @click="leave">Se déconnecter</button>
        </div>
    </div>
</template>

<script setup lang="ts">
const isOpen = useState<boolean>('switcher-open', () => false)
const { members } = useMembers()
const { currentId, select } = useCurrentMember()
const { logout } = useSession()

const close = (): void => {
    isOpen.value = false
}

const choose = async (member: IMember): Promise<void> => {
    await select(member.id)
    close()
    await navigateTo(member.role === 'child' ? '/kid' : '/home')
}

const leave = async (): Promise<void> => {
    close()
    await select(null)
    await logout()
}
</script>
