<template>
    <div class="stack">
        <div class="card stack" style="gap: 6px">
            <div class="subtitle">{{ title }}</div>
            <div class="muted">{{ typeLabel }} · {{ languageLabel(language) }}</div>
            <div class="row" style="justify-content: space-between">
                <span class="subtitle">{{ t('bookDraft.review.pages', { count: pages.length }) }}</span>
                <span class="subtitle">{{ isWordless ? t('bookDraft.book.typeWordless') : t('bookDraft.lines.count', { count: lines.length }) }}</span>
            </div>
            <template v-if="isSimple">
                <div v-if="reader && !isWordless" class="row">
                    <AppAvatar :member="reader" :size="36" />
                    <div class="grow label">{{ t('bookDraft.review.readsAll', { name: reader.name }) }}</div>
                </div>
            </template>
            <template v-else-if="!isWordless">
                <div v-for="character in usedCharacters" :key="character.key" class="row">
                    <AppAvatar :member="getById(character.memberId)" :size="36" />
                    <div class="grow">
                        <div class="label">{{ character.isNarrator ? t('bookDraft.review.narratorName', { name: character.name }) : character.name }}</div>
                        <div class="muted">{{ getById(character.memberId)?.name ?? t('bookDraft.review.pickVoice') }}</div>
                    </div>
                    <span class="badge">{{ countOf(character.key) }}</span>
                </div>
            </template>
        </div>
        <label v-if="isRelative" class="card row" data-testid="proposal-toggle">
            <input v-model="isProposal" type="checkbox" />
            <span class="grow">
                <span class="subtitle">{{ t('library.proposal.toggle') }}</span>
                <span class="muted">{{ t('library.proposal.hint') }}</span>
            </span>
        </label>
        <div v-if="problem" class="error" role="alert">{{ problem }}</div>
        <div v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</div>
        <button type="button" class="btn btn--block" :disabled="problem !== '' || isBusy" @click="save">
            {{ isBusy ? t('bookDraft.review.saving') : t('bookDraft.review.toStudio') }}
        </button>
    </div>
</template>

<script setup lang="ts">
const TYPE_KEYS: Record<BookType, string> = {
    standard: 'bookDraft.book.typeStandard',
    comic: 'bookDraft.book.typeComic',
    wordless: 'bookDraft.book.typeWordless',
    'child-written': 'bookDraft.book.typeChild',
}

const { t } = useI18n()
const {
    isProposal,
    title,
    language,
    type,
    pages,
    lines,
    isSimple,
    isWordless,
    readerId,
    characters,
    usedCharacters,
    voicelessCharacters,
    effectiveCharacterKey,
    toNewBook,
    memberIdsForSave,
    translationsForSave,
    reset,
} = useBookDraft()
const { saveTranslation } = useAi()
const { getById } = useMembers()
const { current } = useCurrentMember()
const isRelative = computed(() => current.value?.role === 'relative')
const { create, get, patch } = useBooks()

const isBusy = ref(false)
const errorMessage = ref('')

const reader = computed(() => getById(readerId.value))
const typeLabel = computed(() => t(TYPE_KEYS[type.value]))
const countOf = (key: number): number => lines.value.filter(line => effectiveCharacterKey(line) === key).length

const problem = computed(() => {
    if (title.value.trim() === '') {
        return t('bookDraft.book.errTitle')
    }
    if (!isWordless.value && lines.value.length === 0) {
        return t('bookDraft.review.errLines')
    }
    if (!isSimple.value && !isWordless.value) {
        const names = characters.value.map(character => character.name.trim().toLowerCase())
        if (names.some(name => name === '') || new Set(names).size !== names.length) {
            return t('bookDraft.review.errNames')
        }
        if (voicelessCharacters.value.length > 0) {
            return t('bookDraft.review.errVoiceless', { names: voicelessCharacters.value.map(character => character.name).join(', ') })
        }
    }
    return ''
})

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
        reset(isSimple.value ? 'simple' : 'casting', readerId.value)
        await navigateTo(`/books/${created.id}/studio`)
    } catch (error) {
        console.error('Le livre n a pas pu être enregistré', error)
        errorMessage.value = apiErrorMessage(error, t('bookDraft.review.saveFailed'))
    } finally {
        isBusy.value = false
    }
}
</script>
