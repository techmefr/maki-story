<template>
    <div v-if="member" class="stack center narrow">
        <NuxtLink to="/kid" class="btn btn--round btn--white" aria-label="Retour"><AppIcon name="back" :size="26" /></NuxtLink>
        <AppAvatar :member="member" :size="150" />
        <h1 class="title">{{ member.name }}</h1>
        <NuxtLink v-if="incoming" :to="`/message/listen/${incoming.id}`" class="btn btn--mint btn--block anim-pulse" style="min-height: 72px; font-size: 1.375rem">
            <AppIcon name="volume" :size="32" motion="pulse" />
            Écouter son message
        </NuxtLink>
        <NuxtLink :to="`/message/${member.id}`" class="btn btn--block" style="min-height: 72px; font-size: 1.375rem">
            <AppIcon name="mic" :size="32" motion="wiggle" />
            Envoyer un message
        </NuxtLink>
        <span v-if="sentLabel" class="badge">{{ sentLabel }}</span>
        <div class="stack" style="width: 100%; text-align: left">
            <NuxtLink
                v-for="book in soloBooks"
                :key="book.id"
                :to="`/kid/listen/${book.id}`"
                class="card card--tap row"
                style="color: inherit; text-decoration: none; min-height: 72px"
                :style="{ background: hexOfBook(book) }"
            >
                <span class="subtitle grow">{{ book.title }}</span>
                <span class="btn btn--round btn--white"><AppIcon name="play" :size="26" motion="pulse" /></span>
            </NuxtLink>
            <AppEmpty v-if="soloBooks.length === 0" title="Pas encore d’histoire avec cette voix." hint="Elle arrive bientôt !" />
        </div>
    </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'kid' })

const route = useRoute()
const { getById } = useMembers()
const { currentId } = useCurrentMember()
const { readyBooks, load: loadBooks } = useBooks()
const { load, startPolling, stopPolling, playableFrom, lastSentTo } = useMessages()

const member = computed(() => getById(String(route.params.id)))
const soloBooks = computed(() => readyBooks.value.filter(book => book.kind === 'solo' && book.soloMemberId === member.value?.id))
const incoming = computed(() => (currentId.value && member.value ? playableFrom(member.value.id, currentId.value) : null))
const sentLabel = computed(() => {
    const sent = currentId.value && member.value ? lastSentTo(currentId.value, member.value.id) : null
    if (!sent) {
        return ''
    }
    return sent.listenedAt ? 'A écouté ✓' : 'Envoyé'
})

const hexOfBook = (book: IBookSummary): string => pickVoiceByText(book.id).hex

onMounted(async () => {
    await Promise.all([loadBooks(), load()])
    startPolling()
})

onBeforeUnmount(stopPolling)
</script>
