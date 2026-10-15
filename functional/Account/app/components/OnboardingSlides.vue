
<template>
    <section class="onboarding" :class="{ 'onboarding--accent': slide.isAccent }" :style="{ background: slide.background }" data-testid="onboarding">
        <div class="onboarding__inner">
            <div class="onboarding__top">
                <AppButton v-if="!isLast" variant="secondary" size="sm" icon="skip-forward" data-testid="onboarding-skip" @click="finish">
                    {{ t('onboarding.skip') }}
                </AppButton>
            </div>
            <div :key="index" class="onboarding__body">
                <AppLogo v-if="index === 0" :size="200" class="onboarding__logo" />
                <div v-else-if="index === 1" class="onboarding__voices" aria-hidden="true">
                    <span class="onboarding__voice onboarding__voice--pink">M</span>
                    <span class="onboarding__voice onboarding__voice--blue">P</span>
                    <span class="onboarding__voice onboarding__voice--violet">Y</span>
                </div>
                <MakiScene v-else pose="heartBook" :size="240" />
                <h1 class="onboarding__title" tabindex="-1">{{ t(`onboarding.slides.${slide.id}.title`) }}</h1>
                <p class="onboarding__text">{{ t(`onboarding.slides.${slide.id}.text`) }}</p>
            </div>
            <p class="sr-only" role="status">{{ t('onboarding.progress', { current: index + 1, total: SLIDES.length }) }}</p>
            <ol class="onboarding__dots" aria-hidden="true">
                <li v-for="(item, position) in SLIDES" :key="item.id" :class="{ 'onboarding__dot--on': position === index }" />
            </ol>
            <AppButton is-block :icon="isLast ? 'rocket' : 'next'" class="onboarding__action" data-testid="onboarding-next" @click="next">
                {{ isLast ? t('onboarding.start') : t('onboarding.next') }}
            </AppButton>
        </div>
    </section>
</template>

<script setup lang="ts">
interface ISlide {
    id: 'welcome' | 'voices' | 'listen'
    background: string
    isAccent: boolean
}

const SLIDES: ISlide[] = [
    { id: 'welcome', background: 'var(--bg)', isAccent: false },
    { id: 'voices', background: 'var(--yellow)', isAccent: true },
    { id: 'listen', background: 'var(--mint-soft)', isAccent: true },
]

const emit = defineEmits<{ done: [] }>()

const { t } = useI18n()

const index = ref(0)

const slide = computed(() => SLIDES[index.value] ?? SLIDES[0]!)
const isLast = computed(() => index.value === SLIDES.length - 1)

const finish = (): void => {
    markOnboardingSeen()
    emit('done')
}

const next = (): void => {
    if (isLast.value) {
        finish()
        return
    }
    index.value += 1
}
</script>

<style scoped>
.onboarding {
    position: fixed;
    inset: 0;
    display: flex;
    justify-content: center;
    overflow-y: auto;
    color: var(--ink);
    transition: background 0.5s ease;
}

.onboarding--accent {
    --ink: var(--on-accent);
    --line: var(--on-accent);
    --ink-soft: var(--on-accent);
}

.onboarding__inner {
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 440px;
    min-height: 100%;
    padding: calc(env(safe-area-inset-top) + 20px) 20px calc(env(safe-area-inset-bottom) + 28px);
}

.onboarding__top {
    display: flex;
    justify-content: flex-end;
    min-height: 48px;
}

.onboarding__body {
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 26px;
    text-align: center;
    animation: onboarding-pop 0.45s ease-out;
}

.onboarding__logo {
    border: 5px solid var(--ink);
    border-radius: 60px;
    box-shadow: 8px 10px 0 var(--line);
    animation: onboarding-float 3s ease-in-out infinite;
}

.onboarding__voices {
    position: relative;
    width: 260px;
    height: 220px;
}

.onboarding__voice {
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 110px;
    height: 110px;
    border: 4px solid var(--ink);
    border-radius: 50%;
    box-shadow: 5px 6px 0 var(--line);
    color: var(--on-accent);
    font: 700 54px/1 var(--font-title);
}

.onboarding__voice--pink {
    inset-inline-start: 0;
    top: 30px;
    background: var(--pink);
}

.onboarding__voice--blue {
    inset-inline-end: 0;
    top: 0;
    background: var(--blue);
}

.onboarding__voice--violet {
    inset-inline-start: 75px;
    bottom: 0;
    background: var(--violet);
}

.onboarding__heart {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 200px;
    height: 200px;
    border: 5px solid var(--ink);
    border-radius: 50%;
    background: var(--paper);
    box-shadow: 8px 10px 0 var(--line);
    color: var(--pink);
}

.onboarding__heart :deep(svg) {
    fill: var(--pink);
    stroke: var(--on-accent);
}

.onboarding__title {
    margin: 0;
    font: 700 min(2.25rem, 10vw) / 1.1 var(--font-title);
    text-wrap: balance;
}

.onboarding__text {
    max-width: 320px;
    margin: 0;
    font: 600 1.25rem / 1.35 var(--font-body);
    text-wrap: balance;
}

.onboarding__dots {
    display: flex;
    justify-content: center;
    gap: 10px;
    margin: 0 0 22px;
    padding: 0;
    list-style: none;
}

.onboarding__dots li {
    width: 16px;
    height: 16px;
    border: 3px solid var(--ink);
    border-radius: 8px;
    background: var(--paper);
    transition: width 0.3s;
}

.onboarding__dots li.onboarding__dot--on {
    width: 44px;
    background: var(--ink);
}

.onboarding__action {
    min-height: 60px;
    font-size: 1.375rem;
}

@keyframes onboarding-pop {
    from {
        opacity: 0;
        transform: scale(0.85);
    }

    to {
        opacity: 1;
        transform: scale(1);
    }
}

@keyframes onboarding-float {
    0%,
    100% {
        transform: translateY(0);
    }

    50% {
        transform: translateY(-8px);
    }
}

@media (prefers-reduced-motion: reduce) {
    .onboarding,
    .onboarding__dots li {
        transition: none;
    }

    .onboarding__body,
    .onboarding__logo {
        animation: none;
    }
}
</style>
