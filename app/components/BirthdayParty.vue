<template>
    <div class="party" role="dialog" aria-modal="true" :aria-label="t('kid.birthday.title', { name })" @keydown.esc="emit('close')">
        <div class="party__confetti" aria-hidden="true">
            <span v-for="piece in CONFETTI" :key="piece.id" class="party__piece" :style="piece.style" />
        </div>
        <div class="party__balloons" aria-hidden="true">
            <svg v-for="balloon in BALLOONS" :key="balloon.id" class="party__balloon" :style="balloon.style" viewBox="0 0 40 70" width="56" height="98">
                <ellipse cx="20" cy="22" rx="16" ry="20" :fill="balloon.hex" stroke="#1F1B3A" stroke-width="2.5" />
                <path d="M20 42 L16 49 L24 49 Z" :fill="balloon.hex" stroke="#1F1B3A" stroke-width="2" stroke-linejoin="round" />
                <path d="M20 49 C 14 56 26 60 20 68" fill="none" stroke="#1F1B3A" stroke-width="2" />
            </svg>
        </div>
        <div ref="card" class="party__card stack center">
            <AppMaki :size="110" class="anim-bounce" />
            <h1 class="title">{{ t('kid.birthday.title', { name }) }}</h1>
            <p class="party__age" aria-live="polite">{{ t('kid.birthday.age', { age: shownAge }) }}</p>
            <AppButton is-block data-focus-default @click="emit('close')">
                <AppIcon name="party" :size="26" motion="bounce" />
                {{ t('kid.birthday.thanks') }}
            </AppButton>
        </div>
    </div>
</template>

<script setup lang="ts">
const { name, age } = defineProps<{ name: string; age: number }>()
const emit = defineEmits<{ close: [] }>()

const { t } = useI18n()
const { play } = useSoundCues()

const COUNT_STEP_MS = 120
const COLORS = VOICE_COLORS.map(color => color.hex)

const CONFETTI = Array.from({ length: 28 }, (_, id) => ({
    id,
    style: {
        left: `${(id * 37) % 100}%`,
        background: COLORS[id % COLORS.length],
        animationDelay: `${(id % 7) * 0.25}s`,
        animationDuration: `${2.6 + (id % 5) * 0.4}s`,
    },
}))

const BALLOONS = Array.from({ length: 5 }, (_, id) => ({
    id,
    hex: COLORS[(id * 2) % COLORS.length] ?? '#FFC940',
    style: { left: `${8 + id * 20}%`, animationDelay: `${id * 0.3}s` },
}))

const shownAge = ref(age)
const card = ref<HTMLElement | null>(null)

onMounted(() => {
    play('success')
    card.value?.querySelector<HTMLElement>('[data-focus-default]')?.focus()
    const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (isReduced || age <= 1) {
        return
    }
    shownAge.value = 0
    const timer = setInterval(() => {
        shownAge.value += 1
        if (shownAge.value >= age) {
            clearInterval(timer)
        }
    }, COUNT_STEP_MS)
    onBeforeUnmount(() => clearInterval(timer))
})
</script>

<style scoped>
.party {
    position: fixed;
    inset: 0;
    z-index: 60;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    overflow: hidden;
    background: rgba(31, 27, 58, 0.78);
}

.party__card {
    position: relative;
    max-width: 420px;
    width: 100%;
    padding: 24px;
    border: 3px solid var(--ink);
    border-radius: 30px;
    background: var(--cream);
    box-shadow: 3px 3px 0 var(--ink);
    text-align: center;
    overflow-wrap: anywhere;
}

.party__age {
    margin: 0;
    font-family: Fredoka, sans-serif;
    font-size: 3rem;
    line-height: 1.1;
    color: var(--ink);
}

.party__piece {
    position: absolute;
    top: -16px;
    width: 10px;
    height: 16px;
    border-radius: 3px;
    animation: party-fall linear infinite;
}

.party__balloon {
    position: absolute;
    bottom: -110px;
    animation: party-rise 6s ease-in infinite;
}

@keyframes party-fall {
    to {
        transform: translateY(110vh) rotate(540deg);
    }
}

@keyframes party-rise {
    to {
        transform: translateY(-120vh);
    }
}

@media (prefers-reduced-motion: reduce) {
    .party__piece,
    .party__balloon {
        animation: none;
    }

    .party__piece {
        top: calc(10% + (var(--i, 0) * 1%));
    }

    .party__balloon {
        bottom: 6%;
    }
}
</style>
