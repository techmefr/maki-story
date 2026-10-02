<template>
    <section class="stack" aria-labelledby="proposals-title" data-testid="proposals-row">
        <h2 id="proposals-title" class="subtitle">{{ t('library.rows.proposals') }} <span class="muted">({{ books.length }})</span></h2>
        <ul class="stack proposals">
            <li v-for="book in books" :key="book.id" class="card stack" :data-proposal="book.title">
                <div class="row">
                    <AppAvatar v-if="proposer(book)" :member="proposer(book)" :size="44" />
                    <div class="grow">
                        <div class="subtitle">{{ book.title }}</div>
                        <div class="muted">{{ t('library.proposals.proposedBy', { name: proposer(book)?.name ?? '' }) }}</div>
                    </div>
                </div>
                <div class="row row--wrap">
                    <AppButton variant="secondary" tone="mint" size="sm" :disabled="busyId === book.id" :aria-label="t('library.proposals.approveLabel', { title: book.title })" @click="answer(book, 'approve')">
                        <AppIcon name="check" :size="18" />{{ t('library.proposals.approve') }}
                    </AppButton>
                    <AppButton variant="secondary" size="sm" :disabled="busyId === book.id" :aria-label="t('library.proposals.declineLabel', { title: book.title })" @click="answer(book, 'decline')">
                        <AppIcon name="close" :size="18" />{{ t('library.proposals.decline') }}
                    </AppButton>
                    <AppButton variant="secondary" size="sm" :aria-label="t('books.sheet.title', { title: book.title })" @click="emit('open', book)">
                        <AppIcon name="book" :size="18" />{{ t('books.row.sheet') }}
                    </AppButton>
                </div>
            </li>
        </ul>
        <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
    </section>
</template>

<script setup lang="ts">
const { books } = defineProps<{ books: IBookSummary[] }>()
const emit = defineEmits<{ open: [book: IBookSummary]; changed: [] }>()

const { t } = useI18n()
const { request } = useApi()
const { getById } = useMembers()

const busyId = ref('')
const errorMessage = ref('')

const proposer = (book: IBookSummary): IMember | null => (book.soloMemberId ? getById(book.soloMemberId) : null)

const answer = async (book: IBookSummary, decision: ProposalDecision): Promise<void> => {
    busyId.value = book.id
    errorMessage.value = ''
    try {
        await request(`/books/${book.id}/proposal`, { method: 'POST', body: { decision } })
        emit('changed')
    } catch (error) {
        console.error('La proposition n a pas pu être traitée', error)
        errorMessage.value = t('library.proposals.error')
    } finally {
        busyId.value = ''
    }
}
</script>

<style scoped>
.proposals {
    list-style: none;
    padding: 0;
    margin: 0;
}
</style>
