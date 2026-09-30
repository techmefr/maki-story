<template>
    <div class="stack">
        <h1 class="title">Bibliothèque</h1>
        <GrimaceNudge />
        <NuxtLink v-if="unreadCount > 0" to="/messages" class="card card--tap row" style="background: #ffc940; color: inherit">
            <span class="subtitle grow">{{ unreadLabel }}</span>
            <span class="badge">Écouter</span>
        </NuxtLink>
        <NuxtLink to="/books/new" class="btn btn--block">Nouveau livre</NuxtLink>
        <div v-if="books.length === 0 && isLoaded" class="card center stack">
            <AppMaki :size="80" />
            <p class="subtitle">Aucun livre pour l’instant</p>
            <p class="muted">Photographie les pages d’un livre papier, découpe les répliques et colorie les voix.</p>
        </div>
        <div class="grid grid--books">
            <BookCard v-for="book in books" :key="book.id" :book="book" />
        </div>
    </div>
</template>

<script setup lang="ts">
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
