<template>
    <section class="card stack" aria-labelledby="age-shift-title" data-testid="age-shift">
        <h2 id="age-shift-title" class="subtitle">{{ t('library.ageShift.title') }}</h2>
        <p class="muted">{{ t('library.ageShift.hint') }}</p>
        <div class="row row--wrap" role="group" :aria-label="t('library.ageShift.title')">
            <AppChip
                v-for="value in SHIFTS"
                :key="value"
                :disabled="isBusy"
                @click="save(value)"
             :selected="(member?.ageShift ?? 0) === value">
                {{ value > 0 ? `+${value}` : value }}
            </AppChip>
        </div>
        <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
    </section>
</template>

<script setup lang="ts">
const SHIFTS = [-2, -1, 0, 1, 2]

const { memberId } = defineProps<{ memberId: string }>()

const { t } = useI18n()
const { getById, update } = useMembers()

const isBusy = ref(false)
const errorMessage = ref('')
const member = computed(() => getById(memberId))

const save = async (ageShift: number): Promise<void> => {
    isBusy.value = true
    errorMessage.value = ''
    try {
        await update(memberId, { ageShift })
    } catch (_error) {
        errorMessage.value = t('library.ageShift.error')
    } finally {
        isBusy.value = false
    }
}
</script>
