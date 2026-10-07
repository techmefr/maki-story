<template>
    <form class="stack create" @submit.prevent="onNext">
        <AppStepper v-if="step !== 'done'" :steps="stepperSteps" :current="groupIndex" :label="t('family.create.groups.label')" />

        <section v-if="step === 'name'" class="stack">
            <h1 id="family-create-title" ref="headingRef" class="title" tabindex="-1">{{ t('family.create.name.title') }}</h1>
            <p class="create__hint">{{ t('family.create.name.hint') }}</p>
            <AppInput v-model="familyName" maxlength="60" :placeholder="t('family.create.name.placeholder')" aria-labelledby="family-create-title" data-testid="family-create-name" />
        </section>

        <section v-else-if="step === 'firstName'" class="stack">
            <h1 id="family-create-title" ref="headingRef" class="title" tabindex="-1">{{ t('family.create.you.firstName') }}</h1>
            <p class="create__hint">{{ t('family.create.you.hint') }}</p>
            <AppInput v-model="firstName" maxlength="60" autocomplete="given-name" aria-labelledby="family-create-title" data-testid="family-create-first-name" />
        </section>

        <section v-else-if="step === 'lastName'" class="stack">
            <h1 id="family-create-title" ref="headingRef" class="title" tabindex="-1">{{ t('family.create.you.lastName') }}</h1>
            <p class="create__hint">{{ t('common.optional') }}</p>
            <AppInput v-model="lastName" maxlength="60" autocomplete="family-name" aria-labelledby="family-create-title" data-testid="family-create-last-name" />
        </section>

        <section v-else-if="step === 'displayName'" class="stack">
            <h1 id="family-create-title" ref="headingRef" class="title" tabindex="-1">{{ t('family.create.you.displayName') }}</h1>
            <p class="create__hint">{{ t('family.create.you.displayHint') }}</p>
            <AppInput v-model="displayName" maxlength="60" :placeholder="firstName" aria-labelledby="family-create-title" data-testid="family-create-display-name" />
        </section>

        <section v-else-if="step === 'childName'" class="stack">
            <h1 id="family-create-title" ref="headingRef" class="title" tabindex="-1">{{ t('family.create.child.title') }}</h1>
            <AppInput v-model="childName" maxlength="60" :placeholder="t('family.create.child.namePlaceholder')" aria-labelledby="family-create-title" data-testid="family-create-child" />
        </section>

        <section v-else-if="step === 'childAge'" class="stack" role="group" aria-labelledby="family-create-title">
            <h1 id="family-create-title" ref="headingRef" class="title" tabindex="-1">{{ t('family.create.child.age') }}</h1>
            <div class="row row--wrap">
                <AppChip v-for="age in AGES" :key="age" :selected="childAge === age" :data-testid="`family-create-age-${age}`" @click="childAge = age">{{ age }}</AppChip>
            </div>
        </section>

        <section v-else-if="step === 'childPhoto'" class="stack">
            <h1 ref="headingRef" class="title" tabindex="-1">{{ t('family.create.child.photo') }}</h1>
            <p class="create__hint">{{ t('common.optional') }}</p>
            <button type="button" class="create__photo" :aria-label="t('family.create.child.photo')" @click="isCapturing = true">
                <img v-if="photoUrl" :src="photoUrl" alt="" class="create__photo-img" />
                <span v-else class="create__photo-empty"><AppIcon name="camera" :size="40" />{{ t('family.create.child.photo') }}</span>
            </button>
            <AppBottomSheet :open="isCapturing" :title="t('member.form.captureTitle')" @close="isCapturing = false">
                <p class="create__hint">{{ t('member.form.captureHint') }}</p>
                <PhotoCapture @captured="onCaptured" />
            </AppBottomSheet>
        </section>

        <section v-else-if="step === 'childCode'" class="stack">
            <h1 ref="headingRef" class="title" tabindex="-1">{{ t('family.create.childCode.title', { name: childName.trim() }) }}</h1>
            <CodeField v-model="childCode" role="child" />
        </section>

        <section v-else-if="step === 'parentCode'" class="stack">
            <h1 ref="headingRef" class="title" tabindex="-1">{{ t('family.create.parentCode.title') }}</h1>
            <CodeField v-model="parentCode" role="parent" :label="t('family.create.parentCode.hint')" />
        </section>

        <section v-else class="stack create__done">
            <span class="create__check"><AppIcon name="check" :size="58" /></span>
            <h1 ref="headingRef" class="title" tabindex="-1">{{ t('family.create.done.title', { name: familyName.trim() }) }}</h1>
            <p class="create__hint">{{ t('family.create.done.hint', { name: childName.trim() }) }}</p>
        </section>

        <p v-if="hasFailed" class="error" role="alert">{{ t('family.create.failed') }}</p>
        <div class="create__action">
            <AppStepNav :next-label="actionLabel" :can-back="step !== 'done'" :is-disabled="!canContinue" :is-busy="isBusy" next-test-id="family-create-next" @back="goBack" />
        </div>
    </form>
</template>

<script setup lang="ts">
const AGES = Array.from({ length: 13 }, (_, index) => index)

const { t } = useI18n()
const { step, stepIndex, groupIndex, familyName, firstName, lastName, displayName, childName, childAge, childPhoto, childCode, parentCode, isBusy, hasFailed, canContinue, back, next } = useFamilyCreate()

const isCapturing = ref(false)
const photoUrl = ref<string | null>(null)

const headingRef = useStepFocus(() => step.value)

const stepperSteps = computed(() => FAMILY_CREATE_GROUPS.map(id => ({ id, label: t(`family.create.groups.${id}`) })))
const actionLabel = computed<string>(() => {
    if (step.value === 'parentCode') {
        return t('family.create.action.parentCode')
    }
    return step.value === 'done' ? t('family.create.action.done') : t('family.create.action.next')
})

const goBack = async (): Promise<void> => {
    if (stepIndex.value === 0) {
        await navigateTo('/families')
        return
    }
    back()
}

const onCaptured = (blob: Blob): void => {
    childPhoto.value = blob
    photoUrl.value = URL.createObjectURL(blob)
    isCapturing.value = false
}

const onNext = async (): Promise<void> => {
    if (step.value === 'done') {
        await navigateTo('/family/invite')
        return
    }
    await next()
}

onBeforeUnmount(() => {
    if (photoUrl.value) {
        URL.revokeObjectURL(photoUrl.value)
    }
})
</script>

<style scoped>
.create {
    min-height: calc(100dvh - 40px);
}

.create__hint {
    margin: 0;
    color: var(--ink-soft);
    font: 600 1.125rem/1.3 var(--font-body);
}

.create__photo {
    align-self: center;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 150px;
    height: 150px;
    padding: 0;
    overflow: hidden;
    border: var(--outline) solid var(--ink);
    border-radius: 50%;
    background: var(--paper);
    box-shadow: var(--shadow);
    color: var(--ink);
    cursor: pointer;
}

.create__photo-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.create__photo-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    font: 700 0.9375rem/1.2 var(--font-body);
    text-align: center;
}

.create__done {
    align-items: center;
    padding-block: 20px;
    text-align: center;
}

.create__check {
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

.create__action {
    margin-top: auto;
}

@media (prefers-reduced-motion: no-preference) {
    .create__check {
        animation: create-pop 0.5s ease-out;
    }
}

@keyframes create-pop {
    0% {
        transform: scale(0.6);
        opacity: 0;
    }
    70% {
        transform: scale(1.1);
    }
    100% {
        transform: scale(1);
        opacity: 1;
    }
}
</style>
