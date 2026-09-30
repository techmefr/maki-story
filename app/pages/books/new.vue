<template>
    <div class="stack narrow">
        <NuxtLink to="/home" class="muted">Annuler</NuxtLink>
        <template v-if="!isStarted">
            <h1 class="title">Nouveau livre</h1>
            <button type="button" class="card card--tap stack" style="gap: 4px" @click="startMulti">
                <span class="subtitle">Plusieurs voix</span>
                <span class="muted">Chaque personnage est lu par un proche différent.</span>
            </button>
            <div class="card stack">
                <span class="subtitle">Une seule voix</span>
                <span class="muted">Un proche lit tout le livre. Qui lit ?</span>
                <MemberPicker :model-value="soloReader" @update:model-value="startSolo" />
            </div>
        </template>
        <template v-else>
            <div class="row" style="justify-content: space-between">
                <h1 class="title">{{ stepTitle }}</h1>
                <span class="badge">{{ stepNumber }}/{{ stepCount }}</span>
            </div>
            <BookStepScan v-if="step === 'scan'" @next="step = 'lines'" />
            <BookStepLines v-else-if="step === 'lines'" @next="afterLines" />
            <BookStepColors v-else-if="step === 'colors'" @next="step = 'review'" />
            <BookStepReview v-else />
            <button v-if="step !== 'scan'" type="button" class="btn btn--white btn--small" @click="back">Retour</button>
        </template>
    </div>
</template>

<script setup lang="ts">
const STEP_TITLES: Record<DraftStep, string> = {
    scan: 'Scanner les pages',
    lines: 'Les répliques',
    colors: 'Colorier les voix',
    review: 'Vérifier',
}

const { step, isSolo, reset } = useBookDraft()
const { current } = useCurrentMember()

const isStarted = ref(false)
const soloReader = ref<string | null>(null)

const steps = computed<DraftStep[]>(() => (isSolo.value ? ['scan', 'lines', 'review'] : ['scan', 'lines', 'colors', 'review']))
const stepCount = computed(() => steps.value.length)
const stepNumber = computed(() => steps.value.indexOf(step.value) + 1)
const stepTitle = computed(() => STEP_TITLES[step.value])

const startMulti = (): void => {
    reset('multi', null)
    isStarted.value = true
}

const startSolo = (memberId: string): void => {
    soloReader.value = memberId
    reset('solo', memberId)
    isStarted.value = true
}

const afterLines = (): void => {
    step.value = isSolo.value ? 'review' : 'colors'
}

const back = (): void => {
    const index = steps.value.indexOf(step.value)
    step.value = steps.value[Math.max(0, index - 1)] ?? 'scan'
}

onMounted(() => {
    if (current.value?.role === 'relative') {
        startSolo(current.value.id)
    }
})
</script>
