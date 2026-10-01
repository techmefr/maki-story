<template>
    <div class="stack">
        <h1 class="title">Bibliothèque</h1>
        <GrimaceNudge />
        <NuxtLink v-if="unreadCount > 0" to="/messages" class="card card--tap row" style="background: #ffc940; color: inherit">
            <AppIcon name="message-heart" :size="30" motion="wiggle" />
            <span class="subtitle grow">{{ unreadLabel }}</span>
            <span class="badge">Écouter</span>
        </NuxtLink>
        <NuxtLink v-if="isOnline" to="/books/new" class="btn btn--block"><AppIcon name="book-plus" :size="22" motion="float" />Nouveau livre</NuxtLink>
        <button v-else type="button" class="btn btn--block" disabled><AppIcon name="cloud-off" :size="22" />Nouveau livre (connexion nécessaire)</button>
        <div v-if="books.length === 0 && isLoaded" class="card center stack">
            <AppMaki :size="80" />
            <p class="subtitle">Aucun livre pour l’instant</p>
            <p class="muted">Photographie les pages d’un livre papier, découpe les répliques et colorie les voix.</p>
        </div>
        <div class="grid grid--books">
            <div v-for="(book, index) in books" :key="book.id" class="stack pop-in" :style="{ '--i': index }">
                <BookCard :book="book" />
                <OfflineToggle v-if="book.status === 'ready'" :book-id="book.id" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
const isOnline = useState<boolean>('is-online', () => true)
const { books, load } = useBooks()
const { currentId } = useCurrentMember()
const { unreadCountFor, load: loadMessages } = useMessages()

const isLoaded = ref(false)

const unreadCount = computed(() => (currentId.value ? unreadCountFor(currentId.value) : 0))
const unreadLabel = computed(() =>
    unreadCount.value > 1 ? `${unreadCount.value} messages t’attendent` : 'Un message t’attend',
)

onMounted(async () => {
    await Promise.all([load(), loadMessages()])
    isLoaded.value = true
})
</script>
