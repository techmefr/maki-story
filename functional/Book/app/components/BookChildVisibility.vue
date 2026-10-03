<template>
    <section class="stack" style="gap: 8px" aria-labelledby="child-visibility-title" data-testid="child-visibility">
        <h3 id="child-visibility-title" class="label">{{ t('library.childVisible.title') }}</h3>
        <div class="row row--wrap" role="group" :aria-label="t('library.childVisible.title')">
            <button
                v-for="option in options"
                :key="option.id"
                type="button"
                class="chip"
                :class="{ 'chip--on': value === option.value }"
                :aria-pressed="value === option.value"
                :disabled="isBusy"
                :data-visibility="option.id"
                @click="save(option.value)"
            >
                {{ option.label }}
            </button>
        </div>
        <p class="muted">{{ t('library.childVisible.hint') }}</p>
        <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
    </section>
</template>

<script setup lang="ts">
const { book } = defineProps<{ book: IBookSummary }>()

const { t } = useI18n()
const { patch } = useBooks()

const value = ref<boolean | null>(book.childVisible ?? null)
const isBusy = ref(false)
const errorMessage = ref('')

const options = computed(() => [
    { id: 'auto', value: null, label: t('library.childVisible.auto') },
    { id: 'show', value: true, label: t('library.childVisible.show') },
    { id: 'hide', value: false, label: t('library.childVisible.hide') },
])

const save = async (next: boolean | null): Promise<void> => {
    isBusy.value = true
    errorMessage.value = ''
    try {
        await patch(book.id, { childVisible: next })
        value.value = next
    } catch (_error) {
        errorMessage.value = t('library.childVisible.error')
    } finally {
        isBusy.value = false
    }
}
</script>
