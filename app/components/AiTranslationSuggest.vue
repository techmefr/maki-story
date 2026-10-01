<template>
    <div class="stack translation" style="gap: 8px">
        <ul v-if="line.translations.length > 0" class="translation__list stack" style="gap: 6px">
            <li v-for="item in line.translations" :key="item.language" class="row" :lang="item.language">
                <span class="badge">{{ languageLabel(item.language) }}</span>
                <span class="grow">{{ item.text }}</span>
                <button
                    type="button"
                    class="btn btn--small btn--white"
                    :aria-label="`Retirer la traduction en ${languageLabel(item.language)}`"
                    @click="removeTranslation(line.key, item.language)"
                >
                    ×
                </button>
            </li>
        </ul>
        <button v-if="!isOpen" type="button" class="chip" :aria-expanded="false" @click="open">
            <AppIcon name="sparkles" :size="16" />Suggérer une traduction
        </button>
        <div v-else class="card stack" role="group" aria-label="Suggestion de traduction">
            <AiNotice text="Traduction proposée par l’IA : relis-la et corrige-la avant de l’accepter." />
            <label class="stack" style="gap: 6px">
                <span class="label">Traduire en</span>
                <select v-model="target" class="input" :disabled="isBusy" @change="suggestion = null">
                    <option v-for="item in targets" :key="item.code" :value="item.code">{{ item.flag }} {{ item.label }}</option>
                </select>
            </label>
            <p v-if="isUnavailable" class="error" role="alert">{{ AI_UNAVAILABLE_MESSAGE }}</p>
            <p v-else-if="isExhausted" class="error" role="alert">{{ AI_QUOTA_MESSAGE }}</p>
            <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
            <p v-if="isBusy" class="muted" role="status">Traduction en cours…</p>
            <label v-if="suggestion !== null" class="stack" style="gap: 6px">
                <span class="label">Traduction proposée en {{ languageLabel(target) }}</span>
                <textarea v-model="suggestion" class="input" :lang="target" />
            </label>
            <div class="row row--wrap">
                <template v-if="suggestion !== null">
                    <button type="button" class="btn btn--mint btn--small" :disabled="suggestion.trim() === ''" @click="accept">Accepter</button>
                    <button type="button" class="btn btn--white btn--small" @click="reject">Rejeter</button>
                </template>
                <button v-else type="button" class="btn btn--small" :disabled="isBusy || isUnavailable || isExhausted" @click="suggest">Suggérer</button>
                <button type="button" class="btn btn--white btn--small" @click="close">Fermer</button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
const { line } = defineProps<{ line: IDraftLine }>()

const { language, setTranslation, removeTranslation } = useBookDraft()
const { suggestTranslation, refreshStatus, isExhausted, isUnavailable } = useAi()

const isOpen = ref(false)
const isBusy = ref(false)
const errorMessage = ref('')
const suggestion = ref<string | null>(null)
const suggestedTone = ref('')
const target = ref('')

const targets = computed(() => LANGUAGES.filter(item => item.code !== language.value))

const open = async (): Promise<void> => {
    target.value = targets.value.find(item => item.code === 'mg')?.code ?? targets.value[0]?.code ?? ''
    isOpen.value = true
    await refreshStatus()
}

const close = (): void => {
    isOpen.value = false
    suggestion.value = null
    errorMessage.value = ''
}

const suggest = async (): Promise<void> => {
    isBusy.value = true
    errorMessage.value = ''
    try {
        const result = await suggestTranslation({
            lines: [{ text: line.text, tone: line.tone }],
            targetLanguage: target.value,
            sourceLanguage: language.value,
        })
        suggestion.value = result.suggestions[0]?.text ?? ''
        suggestedTone.value = result.suggestions[0]?.tone ?? ''
    } catch (error) {
        console.error('La traduction n a pas abouti', error)
        errorMessage.value = aiErrorMessage(error)
    } finally {
        isBusy.value = false
        await refreshStatus()
    }
}

const accept = (): void => {
    if (suggestion.value === null || suggestion.value.trim() === '') {
        return
    }
    setTranslation(line.key, { language: target.value, text: suggestion.value.trim(), tone: suggestedTone.value })
    close()
}

const reject = (): void => {
    suggestion.value = null
}
</script>

<style scoped>
.translation__list {
    list-style: none;
    padding: 0;
    margin: 0;
}
</style>
