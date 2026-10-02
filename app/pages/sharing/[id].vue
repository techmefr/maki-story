<template>
    <div class="stack narrow">
        <NuxtLink to="/sharing" class="muted">{{ t('common.back') }}</NuxtLink>
        <template v-if="book">
            <h1 class="title">{{ book.title }}</h1>
            <p class="muted">{{ t('sharing.detail.help') }}</p>
            <div class="stack" style="gap: 6px">
                <span :id="languageLabelId" class="label">{{ t('library.shareLanguage.label') }}</span>
                <AppSelect
                    :model-value="recordingLanguage"
                    :options="languageOptions"
                    :aria-labelledby="languageLabelId"
                    data-testid="share-language"
                    :disabled="isRecording"
                    @update:model-value="changeLanguage"
                />
                <span v-if="!recordingLanguage" class="muted">{{ t('library.shareLanguage.required') }}</span>
            </div>
            <article v-for="line in book.lines" :key="line.id" class="card stack" :aria-label="t('sharing.detail.lineAria', { name: line.character || t('sharing.detail.narratorLower') })">
                <div class="row">
                    <span class="badge">{{ line.character || t('sharing.detail.narrator') }}</span>
                    <span v-if="line.hasRecording" class="badge" style="background: #4cd4a8">{{ t('sharing.detail.sent') }}</span>
                </div>
                <p>{{ line.text }}</p>
                <p v-if="line.tone || line.note || line.sceneDescription" class="muted">{{ hint(line) }}</p>
                <template v-if="activeId === line.id">
                    <div class="row row--wrap">
                        <AppButton variant="destructive" size="sm" v-if="isRecording" @click="stopRecording">{{ t('messages.compose.stop') }}</AppButton>
                        <template v-else-if="take">
                            <AppButton variant="secondary" size="sm" @click="listen">{{ t('sharing.detail.listenAgain') }}</AppButton>
                            <AppButton variant="secondary" tone="mint" size="sm" :disabled="isBusy" @click="send(line)">{{ t('common.send') }}</AppButton>
                            <AppButton variant="secondary" size="sm" @click="discard">{{ t('common.cancel') }}</AppButton>
                        </template>
                    </div>
                </template>
                <AppButton size="sm" v-else :disabled="isRecording || !recordingLanguage" @click="startRecording(line)">
                    {{ line.hasRecording ? t('sharing.detail.redo') : t('sharing.detail.record') }}
                </AppButton>
            </article>
        </template>
        <p v-else-if="!errorMessage" class="muted">{{ t('common.loading') }}</p>
        <p v-if="recorderError" class="error" role="alert">{{ recorderError }}</p>
        <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
    </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const route = useRoute()
const { getBook, putLine } = useShares()
const { upload } = useFiles()
const { isRecording, errorMessage: recorderError, start, stop } = useRecorder()

const shareId = String(route.params.id)
const book = ref<IShareBook | null>(null)
const activeId = ref<string | null>(null)
const take = ref<IRecording | null>(null)
const isBusy = ref(false)
const errorMessage = ref('')
const recordingLanguage = ref('')
const languageLabelId = useId()
const languageOptions = computed(() => [
    { value: '', label: t('library.shareLanguage.choose') },
    ...LANGUAGES.map(item => ({ value: item.code, label: `${item.flag} ${item.label}` })),
])
const changeLanguage = (value: string): void => {
    recordingLanguage.value = value
    void load()
}

const hint = (line: IShareLine): string => [line.tone, line.note, line.sceneDescription].filter(part => part !== '').join(' · ')

const load = async (): Promise<void> => {
    try {
        book.value = await getBook(shareId, recordingLanguage.value || undefined)
    } catch (_error) {
        errorMessage.value = t('sharing.detail.unavailable')
    }
}

const startRecording = async (line: IShareLine): Promise<void> => {
    take.value = null
    if (await start()) {
        activeId.value = line.id
    }
}

const stopRecording = async (): Promise<void> => {
    take.value = await stop()
    if (take.value === null) {
        activeId.value = null
    }
}

const listen = async (): Promise<void> => {
    if (take.value) {
        await new Audio(URL.createObjectURL(take.value.blob)).play()
    }
}

const discard = (): void => {
    take.value = null
    activeId.value = null
}

const send = async (line: IShareLine): Promise<void> => {
    if (!take.value) {
        return
    }
    isBusy.value = true
    errorMessage.value = ''
    try {
        const fileId = await upload(take.value.blob, take.value.mime)
        await putLine(shareId, line.id, fileId, take.value.ms, recordingLanguage.value)
        discard()
        await load()
    } catch (_error) {
        errorMessage.value = t('sharing.detail.sendFailed')
    } finally {
        isBusy.value = false
    }
}

onMounted(load)
</script>
