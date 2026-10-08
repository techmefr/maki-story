<template>
    <section class="stack" aria-labelledby="row-a-valider">
        <h2 id="row-a-valider" class="subtitle">{{ t('ai.draft.title') }} <span class="muted">({{ books.length }})</span></h2>
        <p class="muted">{{ t('ai.draft.intro') }}</p>
        <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
        <ul class="draft-list stack">
            <li v-for="book in books" :key="book.id" class="card stack" :aria-label="t('ai.draft.label', { title: book.title })">
                <div class="row row--wrap">
                    <span class="subtitle grow">{{ book.title }}</span>
                    <span class="badge">{{ t('ai.draft.badge') }}</span>
                </div>
                <div class="muted">{{ t('ai.draft.meta', { pages: book.pageCount, lines: book.lineCount, language: languageLabel(book.language) }) }}</div>
                <div class="row row--wrap">
                    <AppButton variant="secondary" tone="mint" size="sm" :disabled="busyId === book.id" :aria-label="t('ai.draft.validateLabel', { title: book.title })" @click="validate(book)">
                        <AppIcon name="check" :size="18" />{{ t('ai.draft.validate') }}
                    </AppButton>
                    <AppButton variant="secondary" size="sm" :disabled="busyId === book.id" :aria-label="t('ai.draft.rejectLabel', { title: book.title })" @click="reject(book)">
                        <AppIcon name="trash" :size="18" />{{ t('ai.draft.reject') }}
                    </AppButton>
                </div>
            </li>
        </ul>
    </section>
</template>

<script setup lang="ts">
const { books } = defineProps<{ books: IBookSummary[] }>()
const emit = defineEmits<{ changed: [] }>()

const { t } = useI18n()
const { validateDraft } = useAi()
const { remove } = useBooks()

const busyId = ref<string | null>(null)
const errorMessage = ref('')

const run = async (book: IBookSummary, action: () => Promise<unknown>): Promise<void> => {
    busyId.value = book.id
    errorMessage.value = ''
    try {
        await action()
        emit('changed')
    } catch (error) {
        console.error('Le brouillon n a pas pu être traité', error)
        errorMessage.value = t('ai.draft.error')
    } finally {
        busyId.value = null
    }
}

const validate = (book: IBookSummary): Promise<void> => run(book, () => validateDraft(book.id))
const reject = (book: IBookSummary): Promise<void> => run(book, () => remove(book.id))
</script>

<style scoped>
.draft-list {
    list-style: none;
    padding: 0;
    margin: 0;
}
</style>
