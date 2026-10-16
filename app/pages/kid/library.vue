<template>
    <div class="stack kid-library">
        <StatusStrip />
        <AppButton variant="secondary" is-round to="/kid" class="back-link" :aria-label="t('common.back')"><AppIcon name="back" :size="26" class="mirror-rtl" /></AppButton>
        <h1 class="title">{{ t('kid.library.title') }}</h1>
        <BookFilters :key="route.fullPath" kid :initial="initialQuery" @change="reload">
            <div v-if="readers.length > 0" class="stack library__group" role="group" :aria-label="t('kidBrowse.reader.label')">
                <span class="label library__label"><AppIcon name="users" :size="22" />{{ t('kidBrowse.reader.label') }}</span>
                <div class="row row--wrap">
                    <AppChip v-for="reader in readers" :key="reader.id" :data-testid="`reader-${reader.id}`" :selected="readerId === reader.id" @click="toggleReader(reader.id)">
                        {{ reader.name }}
                    </AppChip>
                </div>
            </div>
        </BookFilters>
        <div class="grid grid--books">
            <BookCard v-for="book in visibleBooks" :key="book.id" :book="book" :to="`/kid/listen/${book.id}`" />
        </div>
        <AppEmpty v-if="visibleBooks.length === 0 && isLoaded" kind="library" :title="t('kid.library.empty')" :hint="t('kid.library.emptyHint')" />
    </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'kid' })

const { t } = useI18n()
const { books, load } = useBooks()
const { load: loadMessages, startPolling, stopPolling } = useMessages()
const { ensureLoaded, getById } = useMembers()

const isLoaded = ref(false)
const readerId = ref('')

const readers = computed(() => {
    const ids = new Set(books.value.flatMap(book => book.readerIds))
    return [...ids].map(id => getById(id)).filter((member): member is IMember => member !== null)
})

const toggleReader = (id: string): void => {
    readerId.value = readerId.value === id ? '' : id
}

const visibleBooks = computed(() => (readerId.value ? books.value.filter(book => book.readerIds.includes(readerId.value)) : books.value))

const route = useRoute()
const initialQuery = computed<IBookQuery>(() => ({
    type: typeof route.query.type === 'string' ? route.query.type : undefined,
    mood: typeof route.query.mood === 'string' ? route.query.mood : undefined,
    theme: typeof route.query.theme === 'string' ? route.query.theme : undefined,
}))

const reload = (query: IBookQuery): Promise<void> => load(query)

watch(initialQuery, query => void load(query))

onMounted(async () => {
    await Promise.all([load(initialQuery.value), loadMessages(), ensureLoaded()])
    isLoaded.value = true
    startPolling()
})

onBeforeUnmount(stopPolling)
</script>

<style scoped>
.kid-library {
    gap: 24px;
}

.kid-library :deep(.book__title) {
    font-size: 1.125rem;
    line-height: 1.3;
}

.kid-library .grid--books {
    gap: 24px 16px;
}

@media (min-width: 1024px) {
    .kid-library .grid--books {
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 28px;
    }
}

.library__group {
    gap: 8px;
}

.library__label {
    display: inline-flex;
    align-items: center;
    gap: 8px;
}
</style>
