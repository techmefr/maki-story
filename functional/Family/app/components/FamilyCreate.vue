<template>
    <div class="stack create">
        <div class="row create__head">
            <AppIconButton v-if="step !== 'done'" icon="back" :label="t('common.back')" @click="goBack" />
            <ol class="create__segments" :aria-label="t('family.create.progress', { current: stepIndex + 1, total: FAMILY_CREATE_STEPS.length })">
                <li v-for="item in FAMILY_CREATE_STEPS" :key="item" class="create__segment" :class="{ 'create__segment--on': FAMILY_CREATE_STEPS.indexOf(item) <= stepIndex }" />
            </ol>
        </div>

        <section v-if="step === 'name'" class="stack">
            <h1 class="title" tabindex="-1">{{ t('family.create.name.title') }}</h1>
            <p class="create__hint">{{ t('family.create.name.hint') }}</p>
            <AppInput v-model="familyName" maxlength="60" :placeholder="t('family.create.name.placeholder')" :aria-label="t('family.create.name.title')" data-testid="family-create-name" />
        </section>

        <section v-else-if="step === 'child'" class="stack">
            <h1 class="title" tabindex="-1">{{ t('family.create.child.title') }}</h1>
            <button type="button" class="create__photo" :aria-label="t('family.create.child.photo')" @click="isCapturing = true">
                <img v-if="photoUrl" :src="photoUrl" alt="" class="create__photo-img" />
                <span v-else class="create__photo-empty"><AppIcon name="camera" :size="40" />{{ t('family.create.child.photo') }}</span>
            </button>
            <AppInput v-model="childName" maxlength="60" :placeholder="t('family.create.child.namePlaceholder')" :aria-label="t('family.create.child.namePlaceholder')" data-testid="family-create-child" />
            <div class="stack create__ages" role="group" :aria-label="t('family.create.child.age')">
                <span class="label">{{ t('family.create.child.age') }}</span>
                <div class="row row--wrap">
                    <AppChip v-for="age in AGES" :key="age" :selected="childAge === age" :data-testid="`family-create-age-${age}`" @click="childAge = age">{{ age }}</AppChip>
                </div>
            </div>
            <AppBottomSheet :open="isCapturing" :title="t('member.form.captureTitle')" @close="isCapturing = false">
                <p class="create__hint">{{ t('member.form.captureHint') }}</p>
                <PhotoCapture @captured="onCaptured" />
            </AppBottomSheet>
        </section>

        <section v-else-if="step === 'childCode'" class="stack">
            <h1 class="title" tabindex="-1">{{ t('family.create.childCode.title', { name: childName.trim() }) }}</h1>
            <CodeField v-model="childCode" role="child" />
        </section>

        <section v-else-if="step === 'parentCode'" class="stack">
            <h1 class="title" tabindex="-1">{{ t('family.create.parentCode.title') }}</h1>
            <CodeField v-model="parentCode" role="parent" :label="t('family.create.parentCode.hint')" />
        </section>

        <section v-else class="stack create__done">
            <span class="create__check"><AppIcon name="check" :size="58" /></span>
            <h1 class="title" tabindex="-1">{{ t('family.create.done.title', { name: familyName.trim() }) }}</h1>
            <p class="create__hint">{{ t('family.create.done.hint', { name: childName.trim() }) }}</p>
        </section>

        <p v-if="hasFailed" class="error" role="alert">{{ t('family.create.failed') }}</p>
        <AppButton is-block class="create__action" :icon="actionIcon" :disabled="isBusy || !canContinue" data-testid="family-create-next" @click="onNext">
            {{ actionLabel }}
        </AppButton>
    </div>
</template>

<script setup lang="ts">
const AGES = Array.from({ length: 13 }, (_, index) => index)

const { t } = useI18n()
const { step, stepIndex, familyName, childName, childAge, childPhoto, childCode, parentCode, isBusy, hasFailed, canContinue, back, next } = useFamilyCreate()

const isCapturing = ref(false)
const photoUrl = ref<string | null>(null)

const actionLabel = computed<string>(() => t(`family.create.action.${step.value}`))
const actionIcon = computed<'next' | 'check' | 'send'>(() => {
    if (step.value === 'parentCode') {
        return 'check'
    }
    return step.value === 'done' ? 'send' : 'next'
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

.create__head {
    gap: 12px;
}

.create__segments {
    display: flex;
    flex: 1;
    gap: 6px;
    margin: 0;
    padding: 0;
    list-style: none;
}

.create__segment {
    flex: 1;
    height: 14px;
    border: var(--outline) solid var(--ink);
    border-radius: 7px;
    background: var(--paper);
}

.create__segment--on {
    background: var(--yellow);
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
