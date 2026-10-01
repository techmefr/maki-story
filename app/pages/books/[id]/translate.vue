<template>
    <div v-if="book" class="stack narrow">
        <NuxtLink :to="`/books/${book.id}/studio`" class="muted">{{ t('translate.back') }}</NuxtLink>
        <h1 class="title">{{ t('translate.title', { title: book.title }) }}</h1>
        <div class="stack">
            <label class="label" for="translate-language">{{ t('translate.language') }}</label>
            <select id="translate-language" v-model="target" class="input" @change="loadDrafts">
                <option v-for="option in targets" :key="option.code" :value="option.code">{{ option.flag }} {{ option.label }}</option>
            </select>
            <span class="badge" role="status">{{ t('translate.count', { done: translatedCount, total: book.lines.length }) }}</span>
        </div>
        <div v-if="isAiEnabled" class="stack">
            <button type="button" class="btn btn--white btn--block" :disabled="isBusy" @click="suggest">
                <AppIcon name="sparkles" :size="22" />{{ t('translate.suggest') }}
            </button>
            <p v-if="hasSuggestions" class="muted" role="status">{{ t('translate.suggestionsHint') }}</p>
        </div>
        <ul class="stack translate__list">
            <li v-for="(line, index) in book.lines" :key="line.id" class="card stack">
                <div class="label">{{ t('translate.line', { n: index + 1, name: line.character || t('translate.narrator') }) }}</div>
                <p class="translate__original" :lang="book.language">{{ line.text }}</p>
                <label class="label" :for="`translate-text-${line.id}`">{{ t('translate.translationIn', { language: targetLabel }) }}</label>
                <textarea
                    :id="`translate-text-${line.id}`"
                    v-model="drafts[line.id]!.text"
                    class="input"
                    rows="2"
                    :lang="target"
                    :data-testid="`translate-text-${index}`"
                />
                <label class="label" :for="`translate-tone-${line.id}`">{{ t('translate.tone') }}</label>
                <input :id="`translate-tone-${line.id}`" v-model="drafts[line.id]!.tone" class="input" :placeholder="t('translate.tonePlaceholder')" />
            </li>
        </ul>
        <p v-if="message" class="muted" role="status">{{ message }}</p>
        <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
        <button type="button" class="btn btn--mint btn--block" :disabled="isBusy" @click="save">
            <AppIcon name="check" :size="22" />{{ t('translate.save') }}
        </button>
    </div>
    <p v-else class="muted">{{ t('common.loading') }}</p>
</template>

<script setup lang="ts">
interface IDraft {
    text: string
    tone: string
}

const { t } = useI18n()
const route = useRoute()
const bookId = String(route.params.id)
const { get, setTranslation } = useBooks()
const { suggestTranslation, status } = useAi()
const { current } = useCurrentMember()

const book = ref<IBook | null>(null)
const target = ref('')
const drafts = ref<Record<string, IDraft>>({})
const isAiEnabled = ref(false)
const isBusy = ref(false)
const hasSuggestions = ref(false)
const message = ref('')
const errorMessage = ref('')

const targets = computed(() => LANGUAGES.filter(option => option.code !== book.value?.language))
const targetLabel = computed(() => LANGUAGES.find(option => option.code === target.value)?.label ?? target.value)
const translatedCount = computed(() => (book.value?.lines ?? []).filter(line => (drafts.value[line.id]?.text ?? '').trim() !== '').length)

const loadDrafts = (): void => {
    const next: Record<string, IDraft> = {}
    for (const line of book.value?.lines ?? []) {
        const saved = book.value?.translations.find(item => item.lineId === line.id && item.language === target.value)
        next[line.id] = { text: saved?.text ?? '', tone: saved?.tone ?? '' }
    }
    drafts.value = next
    hasSuggestions.value = false
    message.value = ''
    errorMessage.value = ''
}

const suggest = async (): Promise<void> => {
    if (!book.value) {
        return
    }
    isBusy.value = true
    errorMessage.value = ''
    try {
        const lines = book.value.lines.map(line => ({ text: line.text, tone: line.tone }))
        const result = await suggestTranslation({ lines, targetLanguage: target.value, sourceLanguage: book.value.language })
        book.value.lines.forEach((line, index) => {
            const suggestion = result.suggestions[index]
            if (suggestion) {
                drafts.value[line.id] = { text: suggestion.text, tone: suggestion.tone }
            }
        })
        hasSuggestions.value = true
    } catch (error) {
        console.error('La suggestion de traduction a échoué', error)
        errorMessage.value = t('translate.suggestFailed')
    } finally {
        isBusy.value = false
    }
}

const save = async (): Promise<void> => {
    if (!book.value) {
        return
    }
    isBusy.value = true
    errorMessage.value = ''
    message.value = ''
    try {
        let saved = 0
        for (const line of book.value.lines) {
            const draft = drafts.value[line.id]
            if (draft && draft.text.trim() !== '') {
                const translation = await setTranslation(bookId, line.id, target.value, { text: draft.text, tone: draft.tone })
                book.value.translations = [
                    ...book.value.translations.filter(item => !(item.lineId === line.id && item.language === target.value)),
                    translation,
                ]
                saved += 1
            }
        }
        hasSuggestions.value = false
        message.value = t('translate.saved', { count: saved, language: targetLabel.value })
    } catch (error) {
        console.error('La traduction n a pas pu être enregistrée', error)
        errorMessage.value = t('translate.saveFailed')
    } finally {
        isBusy.value = false
    }
}

onMounted(async () => {
    try {
        if (current.value && current.value.role !== 'parent') {
            await navigateTo('/home')
            return
        }
        book.value = await get(bookId)
        const known = book.value.translations[0]?.language
        const spoken = (current.value?.spokenLanguages ?? []).find(code => code !== book.value?.language)
        target.value = known ?? spoken ?? targets.value[0]?.code ?? ''
        loadDrafts()
        isAiEnabled.value = (await status().catch(() => null))?.enabled === true
    } catch (error) {
        console.error('Le livre n a pas pu être chargé', error)
        await navigateTo('/home')
    }
})
</script>

<style scoped>
.translate__list {
    list-style: none;
    padding: 0;
    margin: 0;
}

.translate__original {
    margin: 0;
    font-weight: 700;
    overflow-wrap: anywhere;
}
</style>
