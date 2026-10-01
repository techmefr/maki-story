<template>
    <div class="stack narrow">
        <NuxtLink to="/sharing" class="muted">{{ t('common.back') }}</NuxtLink>
        <template v-if="book">
            <h1 class="title">{{ book.title }}</h1>
            <p class="muted">{{ t('sharing.detail.help') }}</p>
            <article v-for="line in book.lines" :key="line.id" class="card stack" :aria-label="t('sharing.detail.lineAria', { name: line.character || t('sharing.detail.narratorLower') })">
                <div class="row">
                    <span class="badge">{{ line.character || t('sharing.detail.narrator') }}</span>
                    <span v-if="line.hasRecording" class="badge" style="background: #4cd4a8">{{ t('sharing.detail.sent') }}</span>
                </div>
                <p>{{ line.text }}</p>
                <p v-if="line.tone || line.note || line.sceneDescription" class="muted">{{ hint(line) }}</p>
                <template v-if="activeId === line.id">
                    <div class="row row--wrap">
                        <button v-if="isRecording" type="button" class="btn btn--coral btn--small" @click="stopRecording">{{ t('messages.compose.stop') }}</button>
                        <template v-else-if="take">
                            <button type="button" class="btn btn--white btn--small" @click="listen">{{ t('sharing.detail.listenAgain') }}</button>
                            <button type="button" class="btn btn--mint btn--small" :disabled="isBusy" @click="send(line)">{{ t('common.send') }}</button>
                            <button type="button" class="btn btn--white btn--small" @click="discard">{{ t('common.cancel') }}</button>
                        </template>
                    </div>
                </template>
                <button v-else type="button" class="btn btn--small" :disabled="isRecording" @click="startRecording(line)">
                    {{ line.hasRecording ? t('sharing.detail.redo') : t('sharing.detail.record') }}
                </button>
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

const hint = (line: IShareLine): string => [line.tone, line.note, line.sceneDescription].filter(part => part !== '').join(' · ')

const load = async (): Promise<void> => {
    try {
        book.value = await getBook(shareId)
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
        await putLine(shareId, line.id, fileId, take.value.ms)
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
