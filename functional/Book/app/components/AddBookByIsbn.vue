<template>
    <div class="stack addbook">
        <BackLink to="/library" />
        <h1 class="title">{{ t('addBook.title') }}</h1>

        <section v-if="phase === 'search'" class="stack">
            <p class="addbook__hint">{{ t('addBook.hint') }}</p>
            <AppButton v-if="canScan" is-block icon="camera" data-testid="isbn-scan" @click="isScanning = true">{{ t('addBook.scan') }}</AppButton>
            <form class="row" @submit.prevent="search">
                <AppInput v-model="isbn" class="grow" inputmode="numeric" :placeholder="t('addBook.placeholder')" :aria-label="t('addBook.isbn')" data-testid="isbn-input" />
                <AppButton type="submit" icon="search" :disabled="isBusy || isbn.trim() === ''" data-testid="isbn-search">{{ t('addBook.search') }}</AppButton>
            </form>
            <div v-if="isMissing" class="stack addbook__card" role="status">
                <strong>{{ t('addBook.missingTitle') }}</strong>
                <p class="addbook__hint">{{ t('addBook.missingHint') }}</p>
                <AppButton variant="secondary" icon="pencil" data-testid="isbn-manual" @click="fillByHand">{{ t('addBook.manual') }}</AppButton>
            </div>
            <p v-if="hasFailed" class="error" role="alert">{{ t('addBook.failed') }}</p>
            <AppBottomSheet :open="isScanning" :title="t('addBook.scan')" @close="isScanning = false">
                <IsbnScanner v-if="isScanning" @detected="onDetected" />
            </AppBottomSheet>
        </section>

        <section v-else-if="phase === 'form'" class="stack">
            <img v-if="coverUrl" :src="coverUrl" alt="" class="addbook__cover" />
            <AppInput v-model="title" maxlength="120" :placeholder="t('addBook.bookTitle')" :aria-label="t('addBook.bookTitle')" data-testid="isbn-title" />
            <AppInput v-model="author" maxlength="120" :placeholder="t('addBook.author')" :aria-label="t('addBook.author')" />
            <div v-if="subjects.length > 0" class="stack">
                <span class="label">{{ t('addBook.subjects') }}</span>
                <div class="row row--wrap"><AppBadge v-for="subject in subjects" :key="subject">{{ subject }}</AppBadge></div>
            </div>
            <div class="stack">
                <div class="row">
                    <span class="label grow">{{ t('addBook.tags') }}</span>
                    <span class="addbook__hint">{{ t('addBook.suggested', { count: autoTags.length }) }}</span>
                </div>
                <div class="row row--wrap">
                    <AppChip v-for="tag in tags" :key="tag.slug" :selected="selectedTags.includes(tag.slug)" :data-testid="`isbn-tag-${tag.slug}`" @click="toggleTag(tag.slug)">
                        {{ labelOf(tag, locale) }}
                        <AppBadge v-if="autoTags.includes(tag.slug)">{{ t('addBook.auto') }}</AppBadge>
                    </AppChip>
                    <AppButton variant="tertiary" size="sm" icon="plus" to="/tags">{{ t('addBook.newTag') }}</AppButton>
                </div>
            </div>
            <p v-if="hasFailed" class="error" role="alert">{{ t('addBook.failed') }}</p>
            <div class="row">
                <AppButton variant="secondary" class="grow" @click="phase = 'search'">{{ t('common.cancel') }}</AppButton>
                <AppButton class="grow" icon="check" :disabled="isBusy || title.trim() === ''" data-testid="isbn-save" @click="save">{{ t('addBook.add') }}</AppButton>
            </div>
        </section>

        <section v-else class="stack addbook__done">
            <span class="addbook__check"><AppIcon name="check" :size="58" /></span>
            <h2 class="title">{{ t('addBook.doneTitle') }}</h2>
            <p class="addbook__hint">{{ title }}</p>
            <AppButton is-block to="/library" icon="book">{{ t('addBook.toLibrary') }}</AppButton>
            <AppButton is-block variant="secondary" icon="plus" @click="again">{{ t('addBook.another') }}</AppButton>
        </section>
    </div>
</template>

<script setup lang="ts">
const { t, locale } = useI18n()
const { labelOf } = useTagLabel()
const { phase, isbn, title, author, subjects, coverUrl, tags, selectedTags, autoTags, isBusy, isMissing, hasFailed, search, fillByHand, toggleTag, save, again } = useIsbnBook()

const isScanning = ref(false)
const canScan = ref(false)

const onDetected = async (code: string): Promise<void> => {
    isScanning.value = false
    isbn.value = code
    await search()
}

onMounted(() => {
    canScan.value = 'BarcodeDetector' in window
})
</script>

<style scoped>
.addbook__hint {
    margin: 0;
    color: var(--ink-soft);
    font: 600 1rem/1.3 var(--font-body);
}

.addbook__card {
    padding: 16px;
    border: var(--outline) solid var(--ink);
    border-radius: 22px;
    background: var(--paper);
    box-shadow: var(--shadow);
}

.addbook__cover {
    align-self: center;
    max-height: 200px;
    border: var(--outline) solid var(--ink);
    border-radius: 14px;
}

.addbook__done {
    align-items: center;
    text-align: center;
}

.addbook__check {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 110px;
    height: 110px;
    border: var(--outline) solid var(--ink);
    border-radius: 50%;
    background: var(--mint);
    box-shadow: var(--shadow);
    color: var(--on-accent);
}
</style>
