<template>
    <div class="stack">
        <h1 class="title">Messages</h1>
        <p v-if="children.length === 0" class="muted">Ajoute un enfant dans la famille pour lui écrire en vocal.</p>
        <div class="grid grid--people">
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
                <AppIcon name="volume" :size="22" motion="pulse" />
                Écouter son message
            </NuxtLink>
            <NuxtLink v-if="isOnline" :to="`/message/${child.member.id}`" class="btn btn--block"><AppIcon name="mic" :size="22" />Lui envoyer un message</NuxtLink>
            <button v-else type="button" class="btn btn--block" disabled><AppIcon name="cloud-off" :size="22" />Connexion nécessaire pour envoyer</button>
        </div>
        </div>
    </div>
</template>

<script setup lang="ts">
const isOnline = useState<boolean>('is-online', () => true)
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
