<template>
    <div class="stack translation" style="gap: 8px">
        <ul v-if="line.translations.length > 0" class="translation__list stack" style="gap: 6px">
            <li v-for="item in line.translations" :key="item.language" class="row" :lang="item.language">
                <span class="badge">{{ languageLabel(item.language) }}</span>
                <span class="grow">{{ item.text }}</span>
                <AppButton variant="secondary" size="sm"
                    :aria-label="t('ai.translate.removeLabel', { language: languageLabel(item.language) })"
                    @click="removeTranslation(line.key, item.language)">
                    ×
                </AppButton>
            </li>
        </ul>
        <button v-if="!isOpen" type="button" class="chip" :aria-expanded="false" @click="open">
            <AppIcon name="sparkles" :size="16" />{{ t('ai.translate.suggestButton') }}
        </button>
        <div v-else class="card stack" role="group" :aria-label="t('ai.translate.groupLabel')">
            <AiNotice :text="t('ai.translate.notice')" />
            <div class="stack" style="gap: 6px">
                <span id="translate-to-label" class="label">{{ t('ai.translate.translateTo') }}</span>
                <AppSelect v-model="target" aria-labelledby="translate-to-label" :disabled="isBusy" :options="targetOptions" @update:model-value="suggestion = null" />
            </div>
            <p v-if="isUnavailable" class="error" role="alert">{{ t(AI_UNAVAILABLE_KEY) }}</p>
            <p v-else-if="isExhausted" class="error" role="alert">{{ t(AI_QUOTA_KEY) }}</p>
            <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
            <p v-if="isBusy" class="muted" role="status">{{ t('ai.translate.busy') }}</p>
            <label v-if="suggestion !== null" class="stack" style="gap: 6px">
                <span class="label">{{ t('ai.translate.proposed', { language: languageLabel(target) }) }}</span>
                <textarea v-model="suggestion" class="input" :lang="target" />
            </label>
            <div class="row row--wrap">
                <template v-if="suggestion !== null">
                    <AppButton variant="secondary" tone="mint" size="sm" :disabled="suggestion.trim() === ''" @click="accept">{{ t('ai.translate.accept') }}</AppButton>
                    <AppButton variant="secondary" size="sm" @click="reject">{{ t('ai.translate.reject') }}</AppButton>
                </template>
                <AppButton size="sm" v-else :disabled="isBusy || isUnavailable || isExhausted" @click="suggest">{{ t('ai.translate.suggest') }}</AppButton>
                <AppButton variant="secondary" size="sm" @click="close">{{ t('common.close') }}</AppButton>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
const { line } = defineProps<{ line: IDraftLine }>()

const { t } = useI18n()
const targetOptions = computed(() => languageSelectOptions(targets.value))
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
        errorMessage.value = t(aiErrorKey(error))
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
