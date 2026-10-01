<template>
    <div class="stack narrow">
        <NuxtLink to="/home" class="muted">Annuler</NuxtLink>
        <div class="row" style="justify-content: space-between">
            <h1 class="title">{{ stepTitle }}</h1>
            <span class="badge">{{ stepNumber }}/{{ stepCount }}</span>
        </div>
        <div v-if="!isWordless" class="row" role="group" aria-label="Nombre de voix">
            <button type="button" class="chip" :class="{ 'chip--on': isSimple }" :aria-pressed="isSimple" @click="setMode('simple')">
                Une seule voix
            </button>
            <button type="button" class="chip" :class="{ 'chip--on': !isSimple }" :aria-pressed="!isSimple" @click="setMode('casting')">
                Plusieurs voix
            </button>
        </div>
        <AiNotice v-if="isAiPrefilled" text="Les personnages, les répliques et les tons viennent de l’IA et peuvent contenir des erreurs. Relis chaque étape avant d’enregistrer." />
        <AiPrefillCard v-if="step === 'book' && isParent && !isAiPrefilled" />
        <BookStepBook v-if="step === 'book'" @next="goNext" />
        <BookStepPages v-else-if="step === 'pages'" @next="goNext" />
        <BookStepCharacters v-else-if="step === 'characters'" @next="goNext" />
        <BookStepLines v-else-if="step === 'lines'" @next="goNext" />
        <BookStepReview v-else />
        <button v-if="step !== 'book'" type="button" class="btn btn--white btn--small" @click="back">Retour</button>
    </div>
</template>

<script setup lang="ts">
const STEP_TITLES: Record<DraftStep, string> = {
    book: 'Le livre',
    pages: 'Les pages',
    characters: 'Les personnages',
    lines: 'Les répliques',
    review: 'Vérifier',
}

const { step, steps, isSimple, isWordless, isAiPrefilled, setMode, reset } = useBookDraft()
const { current, isParent } = useCurrentMember()

const stepCount = computed(() => steps.value.length)
const stepNumber = computed(() => Math.max(1, steps.value.indexOf(step.value) + 1))
const stepTitle = computed(() => STEP_TITLES[step.value])

const move = (offset: number): void => {
    const index = steps.value.indexOf(step.value)
    step.value = steps.value[Math.min(steps.value.length - 1, Math.max(0, index + offset))] ?? 'book'
}

const goNext = (): void => move(1)
const back = (): void => move(-1)

watch(steps, list => {
    if (!list.includes(step.value)) {
        step.value = 'pages'
    }
})

onMounted(() => {
    const member = current.value
    const isRelative = member?.role === 'relative'
    reset(isRelative ? 'simple' : 'casting', member?.id ?? null)
})
</script>
