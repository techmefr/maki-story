<template>
    <section class="stack" data-testid="send-step">
            <div class="card stack" style="gap: 6px">
                <div class="subtitle">{{ title }}</div>
                <div class="muted">{{ typeLabel }} · {{ languageLabel(language) }}</div>
                <div class="row" style="justify-content: space-between">
                    <span class="subtitle">{{ t('bookDraft.review.pages', { count: pages.length }) }}</span>
                    <span class="subtitle">{{ t('bookCreate.flow.voiceCount', { count: voiceCount }) }}</span>
                </div>
            </div>

            <p v-if="isSilentBook" class="card" role="status" data-testid="send-silent">{{ t('bookCreate.flow.silentBookReady') }}</p>

            <section v-else-if="isSimple" class="card stack">
                <div v-if="reader" class="row">
                    <AppAvatar :member="reader" :size="36" />
                    <div class="grow label">{{ t('bookDraft.review.readsAll', { name: reader.name }) }}</div>
                </div>
            </section>

            <section v-else class="stack" :aria-label="t('bookCreate.flow.characters')">
                <h3 class="subtitle">{{ t('bookCreate.flow.characters') }}</h3>
                <ul class="send__list">
                    <li v-for="row in rows" :key="row.key" class="send__row" :data-testid="`send-character-${row.name}`">
                        <span class="subtitle">{{ row.name }}</span>
                        <span class="badge" :class="{ 'send__later': row.isLater }">{{ row.label }}</span>
                    </li>
                </ul>
                <p v-if="laterCount > 0" class="muted" role="status" data-testid="send-later">{{ t('bookCreate.flow.toAssignCount', { count: laterCount }) }}</p>
            </section>

            <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
            <AppButton is-block icon="send" :disabled="isBusy" data-testid="book-save" @click="save">{{ t('bookCreate.flow.send') }}</AppButton>
            <AppButton variant="secondary" is-block icon="back" data-testid="send-back" @click="emit('back')">{{ t('bookCreate.flow.backToPages') }}</AppButton>

    </section>
</template>

<script setup lang="ts">
const TYPE_KEYS: Record<BookType, string> = {
    standard: 'bookDraft.book.typeStandard',
    comic: 'bookDraft.book.typeComic',
    wordless: 'bookDraft.book.typeWordless',
    'child-written': 'bookDraft.book.typeChild',
}

const emit = defineEmits<{ back: []; sent: [result: { id: string; isSilent: boolean }] }>()

const { t } = useI18n()
const { title, language, type, pages, isSimple, isWordless, readerId, sentCharacters, toNewBook, memberIdsForSave, translationsForSave, reset, clearDraft, clearServerDraft } = useBookDraft()
const { saveTranslation } = useAi()
const { getById } = useMembers()
const { create, get, patch } = useBooks()

const isBusy = ref(false)
const errorMessage = ref('')

const reader = computed(() => getById(readerId.value))
const typeLabel = computed(() => t(TYPE_KEYS[type.value]))
const sent = computed(() => toNewBook())
const voiceCount = computed(() => sent.value.lines.length)
const isSilentBook = computed(() => isWordless.value || sent.value.lines.length === 0)

const isLater = (character: IDraftCharacter): boolean => character.assignment === 'later' || (character.assignment === 'relative' && character.memberId === null)

const labelOf = (character: IDraftCharacter): string => {
    if (character.assignment === 'relative' && character.memberId !== null) {
        return getById(character.memberId)?.name ?? t('bookCreate.flow.toAssign')
    }
    if (character.assignment === 'ai') {
        return t('bookCreate.flow.aiLabel')
    }
    if (character.assignment === 'open') {
        return t('bookCreate.flow.openLabel')
    }
    return t('bookCreate.flow.toAssign')
}

const rows = computed(() => sentCharacters().map(character => ({ key: character.key, name: character.name, label: labelOf(character), isLater: isLater(character) })))
const laterCount = computed(() => rows.value.filter(row => row.isLater).length)

const save = async (): Promise<void> => {
    isBusy.value = true
    errorMessage.value = ''
    try {
        const created = await create(toNewBook())
        const translations = translationsForSave()
        const hasTranslations = translations.some(list => list.length > 0)
        if ((!isSimple.value && !isWordless.value) || hasTranslations) {
            const book = await get(created.id)
            if (!isSimple.value && !isWordless.value) {
                const memberIds = memberIdsForSave()
                await patch(created.id, { lines: book.lines.map((saved, index) => ({ id: saved.id, memberId: memberIds[index] ?? null })) })
            }
            for (const [index, saved] of book.lines.entries()) {
                for (const item of translations[index] ?? []) {
                    await saveTranslation(created.id, saved.id, item.language, item.text, item.tone)
                }
            }
        }
        const wasSilent = isSilentBook.value
        clearDraft()
        await clearServerDraft()
        reset(isSimple.value ? 'simple' : 'casting', readerId.value)
        emit('sent', { id: created.id, isSilent: wasSilent })
    } catch (error) {
        console.error('Le livre n a pas pu être enregistré', error)
        errorMessage.value = errorText(error, 'bookDraft.review.saveFailed')
    } finally {
        isBusy.value = false
    }
}
</script>

<style scoped>
.send__list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin: 0;
    padding: 0;
    list-style: none;
}

.send__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 16px;
    border: var(--outline) solid var(--ink);
    border-radius: 16px;
    background: var(--paper);
}

.send__later {
    background: var(--yellow);
    color: var(--on-accent);
}
</style>
