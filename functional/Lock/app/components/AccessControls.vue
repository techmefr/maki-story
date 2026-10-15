<template>
    <section class="stack controls" aria-labelledby="controls-title" data-testid="access-controls">
        <h2 id="controls-title" class="subtitle">{{ t('accessControls.title', { name }) }}</h2>

        <fieldset v-for="range in RANGES" :key="range" class="controls__card">
            <legend class="sr-only">{{ t(`accessControls.${range}.title`) }}</legend>
            <AppToggle v-model="controls[range].isEnabled" :data-testid="`controls-${range}-enabled`">
                <span class="controls__text">
                    <span class="controls__title">{{ t(`accessControls.${range}.title`) }}</span>
                    <span class="controls__hint">{{ t(`accessControls.${range}.hint`) }}</span>
                </span>
            </AppToggle>
            <div v-if="controls[range].isEnabled" class="row row--wrap">
                <label class="stack controls__field">
                    <span class="label">{{ t('accessControls.from') }}</span>
                    <input v-model="controls[range].from" class="input" type="time" required :data-testid="`controls-${range}-from`" />
                </label>
                <label class="stack controls__field">
                    <span class="label">{{ t('accessControls.to') }}</span>
                    <input v-model="controls[range].to" class="input" type="time" required :data-testid="`controls-${range}-to`" />
                </label>
            </div>
        </fieldset>

        <AppToggle v-model="controls.isApprovalEnabled" data-testid="controls-approval-enabled">
            <span class="controls__text">
                <span class="controls__title">{{ t('accessControls.approval.title') }}</span>
                <span class="controls__hint">{{ t('accessControls.approval.hint') }}</span>
            </span>
        </AppToggle>

        <p v-if="hasFailed" class="error" role="alert">{{ t(errorKey) }}</p>
        <AppButton is-block :icon="isSaved ? 'check' : 'lock'" :disabled="isBusy" data-testid="controls-save" @click="persist">
            {{ isSaved ? t('accessControls.saved') : t('accessControls.save') }}
        </AppButton>
    </section>
</template>

<script setup lang="ts">
type TRangeKey = 'night' | 'listening' | 'homework'

const RANGES: TRangeKey[] = ['night', 'listening', 'homework']

const { memberId } = defineProps<{ memberId: string; name: string }>()

const { t } = useI18n()
const { load, save } = useAccessControls()

const controls = ref<IAccessControls>(defaultControls())
const isBusy = ref(false)
const isSaved = ref(false)
const hasFailed = ref(false)
const errorKey = ref('accessControls.failed')

const fetchControls = async (): Promise<void> => {
    hasFailed.value = false
    isSaved.value = false
    try {
        controls.value = await load(memberId)
    } catch (_error) {
        errorKey.value = 'accessControls.loadFailed'
        hasFailed.value = true
    }
}

const hasEmptyRange = (): boolean => RANGES.some(range => controls.value[range].isEnabled && controls.value[range].from === controls.value[range].to)

const persist = async (): Promise<void> => {
    hasFailed.value = false
    isSaved.value = false
    if (hasEmptyRange()) {
        errorKey.value = 'accessControls.sameTime'
        hasFailed.value = true
        return
    }
    isBusy.value = true
    try {
        await save(memberId, { ...controls.value, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone })
        isSaved.value = true
    } catch (_error) {
        errorKey.value = 'accessControls.failed'
        hasFailed.value = true
    } finally {
        isBusy.value = false
    }
}

watch(controls, () => {
    isSaved.value = false
}, { deep: true })

watch(() => memberId, fetchControls)

onMounted(fetchControls)
</script>

<style scoped>
.controls__card {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin: 0;
    padding: 14px;
    border: var(--outline) solid var(--ink);
    border-radius: 22px;
    background: var(--paper);
    box-shadow: var(--shadow);
}

.controls__text {
    display: flex;
    flex-direction: column;
}

.controls__title {
    font: 700 1.0625rem/1.2 var(--font-title);
}

.controls__hint {
    color: var(--ink-soft);
    font: 600 0.875rem/1.3 var(--font-body);
}

.controls__field {
    gap: 4px;
}
</style>
