<template>
    <section class="stack lookup" data-testid="isbn-lookup">
        <AppButton variant="secondary" is-block icon="search" :aria-expanded="isOpen" data-testid="isbn-lookup-open" @click="isOpen = !isOpen">
            {{ t('bookDraft.book.isbnOpen') }}
        </AppButton>
        <div v-if="isOpen" class="stack lookup__panel">
            <AppButton v-if="canScan" is-block icon="camera" data-testid="isbn-scan" @click="isScanning = true">{{ t('addBook.scan') }}</AppButton>
            <form class="row" @submit.prevent="search">
                <AppInput v-model="code" class="grow" inputmode="numeric" :placeholder="t('addBook.placeholder')" :aria-label="t('addBook.isbn')" data-testid="isbn-input" />
                <AppButton type="submit" icon="search" :disabled="isBusy || code.trim() === ''" data-testid="isbn-search">{{ t('addBook.search') }}</AppButton>
            </form>
            <p v-if="isMissing" class="lookup__note" role="status">{{ t('addBook.missingTitle') }} {{ t('addBook.missingHint') }}</p>
            <p v-if="hasFailed" class="error" role="alert">{{ t('addBook.failed') }}</p>
        </div>
        <p v-if="isFilled" class="lookup__note" role="status" data-testid="isbn-filled">{{ t('bookDraft.book.isbnFilled') }}</p>
        <AppBottomSheet :open="isScanning" :title="t('addBook.scan')" @close="isScanning = false">
            <IsbnScanner v-if="isScanning" @detected="onDetected" />
        </AppBottomSheet>
    </section>
</template>

<script setup lang="ts">
const emit = defineEmits<{ found: [book: IIsbnBook] }>()

const { t } = useI18n()
const { request } = useApi()

const isOpen = ref(false)
const isScanning = ref(false)
const canScan = ref(false)
const code = ref('')
const isBusy = ref(false)
const isMissing = ref(false)
const hasFailed = ref(false)
const isFilled = ref(false)

const search = async (): Promise<void> => {
    isBusy.value = true
    isMissing.value = false
    hasFailed.value = false
    isFilled.value = false
    try {
        const found = await request<IIsbnBook>(`/books/isbn/${encodeURIComponent(code.value.trim())}`)
        emit('found', found)
        isFilled.value = true
        isOpen.value = false
    } catch (error) {
        const status = (error as { statusCode?: number }).statusCode
        isMissing.value = status === 404
        hasFailed.value = status !== 404
    } finally {
        isBusy.value = false
    }
}

const onDetected = async (detected: string): Promise<void> => {
    isScanning.value = false
    code.value = detected
    await search()
}

onMounted(() => {
    canScan.value = 'BarcodeDetector' in window
})
</script>

<style scoped>
.lookup__panel {
    padding: 14px;
    border: var(--outline) solid var(--ink);
    border-radius: 22px;
    background: var(--paper);
}

.lookup__note {
    margin: 0;
    color: var(--ink-soft);
    font: 600 0.9375rem/1.3 var(--font-body);
}
</style>
