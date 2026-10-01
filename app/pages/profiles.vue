<template>
    <div class="stack narrow">
        <div class="row" style="justify-content: space-between">
            <AppLogo :size="48" />
            <button type="button" class="btn btn--small btn--white" @click="leave">{{ t('profile.logout') }}</button>
        </div>
        <ProfileUnlock v-if="target" :key="target.id" :member="target" @unlocked="enter(target)" @cancel="target = null" />
        <template v-else>
            <div class="row">
                <AppMaki :size="56" class="anim-float" />
                <h1 class="title">{{ t('profile.who') }}</h1>
            </div>
            <button
                v-for="(member, index) in members"
                :key="member.id"
                type="button"
                class="card card--tap row pop-in"
                :style="{ '--i': index }"
                @click="target = member"
            >
                <AppAvatar :member="member" :size="60" />
                <div class="grow">
                    <div class="subtitle">{{ member.name }}</div>
                    <div class="muted">{{ roleLabel(member.role) }}</div>
                </div>
            </button>
            <NuxtLink to="/family/add" class="btn btn--white btn--block">{{ t('family.index.add') }}</NuxtLink>
        </template>
    </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'blank' })

const { people: members } = useMembers()
const { select } = useCurrentMember()
const { logout } = useSession()
const { t } = useI18n()

const target = ref<IMember | null>(null)

const enter = async (member: IMember): Promise<void> => {
    await navigateTo(member.role === 'child' ? '/kid' : '/home')
}

const leave = async (): Promise<void> => {
    await select(null)
    await logout()
}
</script>
