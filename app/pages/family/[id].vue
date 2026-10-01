<template>
    <div class="stack narrow">
        <NuxtLink to="/family" class="link-back"><AppIcon name="back" :size="18" />Retour</NuxtLink>
        <h1 class="title">Modifier</h1>
        <MemberForm v-if="member && !member.isGuest" :member="member" @saved="done" />
        <h2 v-else-if="member" class="subtitle">{{ member.name }}</h2>
        <MemberCodeAdmin v-if="liveMember && !liveMember.isGuest && isParentViewing && liveMember.id !== current?.id" :member="liveMember" />
        <ChildParental v-if="member && member.role === 'child' && isParentViewing" :member-id="member.id" />
        <MemberVoiceStatus v-if="member && member.role === 'relative' && current?.role === 'parent'" :member-id="member.id" />
        <p v-else class="muted">Ce proche n’existe plus.</p>
    </div>
</template>

<script setup lang="ts">
const route = useRoute()
const { getById } = useMembers()
const { current } = useCurrentMember()

const isParentViewing = computed(() => current.value?.role === 'parent')
const member = ref(getById(String(route.params.id)))
const liveMember = computed(() => getById(String(route.params.id)))

watch(liveMember, fresh => {
    if (fresh) {
        member.value = fresh
    }
})

const done = async (): Promise<void> => {
    await navigateTo('/family')
}
</script>
