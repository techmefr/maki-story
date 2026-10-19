<template>
    <div v-if="book" class="stack narrow">
        <BackLink :to="`/books/${book.id}/studio`" />
        <AppPageIntro icon="languages" tone="yellow" :title="t('translate.title', { title: book.title })" />
        <div class="row row--wrap" role="group" :aria-label="t('translate.language')">
            <AppChip v-for="option in targets" :key="option.code" :selected="target === option.code" :lang="option.code" :data-testid="`translate-language-${option.code}`" @click="chooseLanguage(option.code)">
                <FlagIcon :codes="[option.code]" :size="26" />{{ option.label }}
                <AppIcon v-if="isDone(option.code)" name="check" :size="16" />
            </AppChip>
        </div>
        <section class="stack translate__summary" aria-labelledby="translate-progress">
            <h2 id="translate-progress" class="subtitle" role="status">{{ t('translate.count', { done: translatedCount, total: book.lines.length }) }}</h2>
            <AppProgress :value="progressPercent" :label="t('translate.count', { done: translatedCount, total: book.lines.length })" />
            <AppToggle :model-value="isDone(target)" :disabled="isBusy || target === ''" data-testid="translate-done" @update:model-value="toggleDone">
                <span class="translate__toggle">
                    <span class="translate__toggle-title">{{ t('translate.markDone') }}</span>
                    <span class="translate__toggle-hint">{{ t('translate.markDoneHint') }}</span>
                </span>
            </AppToggle>
        </section>
        <div v-if="isAiEnabled" class="stack">
            <AppButton variant="secondary" is-block icon="sparkles" :disabled="isBusy" @click="suggest">{{ t('translate.suggest') }}</AppButton>
            <p v-if="hasSuggestions" class="muted" role="status">{{ t('translate.suggestionsHint') }}</p>
        </div>
        <ul class="stack translate__list">
            <li v-for="(line, index) in book.lines" :key="line.id" class="translate__line stack">
                <div class="label">{{ t('translate.line', { n: index + 1, name: line.character || t('translate.narrator') }) }}</div>
                <p class="translate__original" :lang="book.language">{{ line.text }}</p>
                <AppTextarea
                    v-model="drafts[line.id]!.text"
                    rows="2"
                    :lang="target"
                    :aria-label="t('translate.translationIn', { language: targetLabel })"
                    :placeholder="t('translate.translationIn', { language: targetLabel })"
                    :data-testid="`translate-text-${index}`"
                />
                <AppInput v-model="drafts[line.id]!.tone" :aria-label="t('translate.tone')" :placeholder="t('translate.tonePlaceholder')" />
            </li>
        </ul>
        <p v-if="message" class="muted" role="status">{{ message }}</p>
        <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
        <AppButton is-block icon="check" :disabled="isBusy" class="translate__save" @click="save">{{ t('translate.save') }}</AppButton>
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
const { request } = useApi()
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

const { languages: familyLanguages, ensureLoaded: loadFamilyLanguages } = useTagLanguages()
const targets = computed(() => LANGUAGES.filter(option => option.code !== book.value?.language && familyLanguages.value.includes(option.code)))
const targetLabel = computed(() => LANGUAGES.find(option => option.code === target.value)?.label ?? target.value)
const translatedCount = computed(() => (book.value?.lines ?? []).filter(line => (drafts.value[line.id]?.text ?? '').trim() !== '').length)

const progressPercent = computed<number>(() => (book.value && book.value.lines.length > 0 ? Math.round((translatedCount.value / book.value.lines.length) * 100) : 0))
const isDone = (code: string): boolean => book.value?.translatedLanguages.includes(code) ?? false

const chooseLanguage = (code: string): void => {
    target.value = code
    loadDrafts()
}

const toggleDone = async (value: boolean): Promise<void> => {
    if (!book.value || target.value === '') {
        return
    }
    isBusy.value = true
    errorMessage.value = ''
    try {
        const result = await request<{ translatedLanguages: string[] }>(`/books/${book.value.id}/translation-done`, { method: 'PUT', body: { language: target.value, isDone: value } })
        book.value.translatedLanguages = result.translatedLanguages
    } catch (_error) {
        errorMessage.value = t('translate.doneFailed')
    } finally {
        isBusy.value = false
    }
}

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
            await navigateTo('/library')
            return
        }
        await loadFamilyLanguages()
        book.value = await get(bookId)
        const known = book.value.translations[0]?.language
        const spoken = (current.value?.spokenLanguages ?? []).find(code => code !== book.value?.language)
        target.value = known ?? spoken ?? targets.value[0]?.code ?? ''
        loadDrafts()
        isAiEnabled.value = useAiCreationEnabled() && (await status().catch(() => null))?.enabled === true
    } catch (error) {
        console.error('Le livre n a pas pu être chargé', error)
        await navigateTo('/library')
    }
})
</script>

<style scoped>
.translate__list {
    margin: 0;
    padding: 0;
    list-style: none;
}

.translate__summary,
.translate__line {
    padding: 14px;
    border: var(--outline) solid var(--ink);
    border-radius: 22px;
    background: var(--paper);
    box-shadow: var(--shadow);
}

.translate__original {
    margin: 0;
    font-weight: 700;
    overflow-wrap: anywhere;
}

.translate__toggle {
    display: flex;
    flex-direction: column;
}

.translate__toggle-title {
    font: 700 1.0625rem/1.2 var(--font-title);
}

.translate__toggle-hint {
    color: var(--ink-soft);
    font: 600 0.875rem/1.3 var(--font-body);
}
</style>
