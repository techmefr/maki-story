<template>
    <div class="stack">
        <h1 class="title">Messages</h1>
        <p v-if="children.length === 0" class="muted">Ajoute un enfant dans la famille pour lui écrire en vocal.</p>
        <div v-for="child in threads" :key="child.member.id" class="card stack">
            <div class="row">
                <AppAvatar :member="child.member" :size="52" />
                <div class="grow">
                    <div class="subtitle">{{ child.member.name }}</div>
                    <div class="muted">{{ child.statusLabel }}</div>
                </div>
            </div>
            <NuxtLink
                v-if="child.incoming"
                :to="`/message/listen/${child.incoming.id}`"
                class="btn btn--mint btn--block"
            >
                Écouter son message
            </NuxtLink>
            <NuxtLink :to="`/message/${child.member.id}`" class="btn btn--block">Lui envoyer un message</NuxtLink>
        </div>
    </div>
</template>

<script setup lang="ts">
const { children } = useMembers()
const { currentId } = useCurrentMember()
const { load, startPolling, stopPolling, playableFrom, lastSentTo } = useMessages()

const threads = computed(() =>
    children.value.map(member => {
        const sent = currentId.value ? lastSentTo(currentId.value, member.id) : null
        const incoming = currentId.value ? playableFrom(member.id, currentId.value) : null
        const statusLabel = incoming
            ? 'Un message t’attend'
            : sent
              ? sent.listenedAt
                  ? 'A écouté ✓'
                  : 'Envoyé'
              : 'Aucun message'
        return { member, incoming, statusLabel }
    }),
)

onMounted(async () => {
    await load()
    startPolling()
})

onBeforeUnmount(stopPolling)
</script>
