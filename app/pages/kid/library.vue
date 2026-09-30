<template>
    <div class="stack">
        <NuxtLink to="/kid" class="muted">Retour</NuxtLink>
        <h1 class="title">Histoires à plusieurs voix</h1>
        <div class="grid grid--books">
        <NuxtLink
            v-for="book in multiBooks"
            :key="book.id"
            :to="`/kid/listen/${book.id}`"
            class="card card--tap stack"
            style="color: inherit; text-decoration: none; min-height: 88px; gap: 8px"
            :style="{ background: hexOfBook(book) }"
        >
            <span class="subtitle">{{ book.title }}</span>
            <VoiceDots :member-ids="book.memberIds" />
        </NuxtLink>
        </div>
        <p v-if="multiBooks.length === 0" class="muted center">Aucune histoire pour l’instant.</p>
    </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'kid' })

const { readyBooks, load } = useBooks()

const multiBooks = computed(() => readyBooks.value.filter(book => book.kind === 'multi'))

const hexOfBook = (book: IBookSummary): string => pickVoiceByText(book.id).hex

onMounted(load)
</script>
