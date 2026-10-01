<template>
    <div class="sheet-backdrop" @click.self="emit('close')">
        <form class="sheet stack" role="dialog" aria-modal="true" aria-labelledby="share-title" @submit.prevent="submit">
            <h2 id="share-title" class="subtitle">{{ t('sharing.dialog.title', { title: book.title }) }}</h2>
            <label class="stack" style="gap: 6px">
                <span class="label">{{ t('sharing.dialog.code') }}</span>
                <input v-model="code" class="input" autocomplete="off" autocapitalize="none" spellcheck="false" required />
            </label>
            <fieldset class="stack fieldset">
                <legend class="label">{{ t('sharing.dialog.how') }}</legend>
                <label class="row">
                    <input v-model="mode" type="radio" value="record" />
                    <span>{{ t('sharing.dialog.modeRecord') }}</span>
                </label>
                <label class="row">
                    <input v-model="mode" type="radio" value="copy" />
                    <span>{{ t('sharing.dialog.modeCopy') }}</span>
                </label>
            </fieldset>
            <fieldset v-if="mode === 'record'" class="stack fieldset">
                <legend class="label">{{ t('sharing.dialog.linesToRecord') }}</legend>
                <p v-if="lines.length === 0" class="muted">{{ t('common.loading') }}</p>
                <label v-for="line in lines" :key="line.id" class="row">
                    <input v-model="selected" type="checkbox" :value="line.id" />
                    <span>{{ line.character ? t('sharing.dialog.line', { character: line.character, text: line.text }) : line.text }}</span>
                </label>
            </fieldset>
            <label class="stack" style="gap: 6px">
                <span class="label">{{ t('sharing.dialog.note') }}</span>
                <input v-model="message" class="input" maxlength="200" />
            </label>
            <p v-if="statusMessage" class="muted" role="status">{{ statusMessage }}</p>
            <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
            <button type="submit" class="btn btn--block" :disabled="!canSubmit || isBusy">{{ t('common.send') }}</button>
            <button type="button" class="btn btn--white btn--block" @click="emit('close')">{{ t('common.close') }}</button>
        </form>
    </div>
</template>

<script setup lang="ts">
const { book } = defineProps<{ book: IBookSummary }>()
const emit = defineEmits<{ close: [] }>()

const { t } = useI18n()
const { get } = useBooks()
const { create } = useShares()

const code = ref('')
const mode = ref<ShareMode>('copy')
const message = ref('')
const lines = ref<ILine[]>([])
const selected = ref<string[]>([])
const isBusy = ref(false)
const errorMessage = ref('')
const statusMessage = ref('')

const canSubmit = computed(() => code.value.trim() !== '' && (mode.value === 'copy' || selected.value.length > 0))

const ERROR_KEYS: Record<number, string> = {
    404: 'sharing.dialog.notFound',
    409: 'sharing.dialog.conflict',
    429: 'sharing.dialog.tooMany',
    403: 'sharing.dialog.forbidden',
}

watch(mode, async value => {
    if (value === 'record' && lines.value.length === 0) {
        const full = await get(book.id)
        lines.value = full.lines
        selected.value = full.lines.filter(line => line.audioFileId === null).map(line => line.id)
    }
})

const submit = async (): Promise<void> => {
    isBusy.value = true
    errorMessage.value = ''
    statusMessage.value = ''
    try {
        const result = await create({
            bookId: book.id,
            code: code.value,
            mode: mode.value,
            lineIds: mode.value === 'record' ? selected.value : undefined,
            message: message.value,
        })
        statusMessage.value =
            result.status === 'pending'
                ? t('sharing.dialog.sentTo', { name: result.targetFamilyName })
                : t('sharing.dialog.needsApproval')
    } catch (error) {
        const status = (error as { statusCode?: number }).statusCode ?? 0
        errorMessage.value = t(ERROR_KEYS[status] ?? 'sharing.dialog.failed')
    } finally {
        isBusy.value = false
    }
}
</script>

<style scoped>
.fieldset {
    border: 0;
    padding: 0;
    margin: 0;
}
</style>
