<template>
    <div class="symbols stack">
        <div class="symbols__slots" aria-hidden="true">
            <span v-for="slot in slotCount" :key="slot" class="symbols__slot">
                <svg v-if="chosen[slot - 1] !== undefined" class="symbols__pop" viewBox="0 0 24 24" width="30" height="30">
                    <path :d="SYMBOL_PATHS[symbolAt(slot - 1).shape]" :fill="symbolAt(slot - 1).fill" stroke="var(--ink)" stroke-width="1.8" stroke-linejoin="round" />
                </svg>
            </span>
        </div>
        <p class="sr-only" role="status" aria-live="polite">{{ t('profile.symbols.chosen', { count: chosen.length, total: SYMBOL_MAX_LENGTH }) }}</p>
        <div class="symbols__grid">
            <button
                v-for="symbol in SYMBOLS"
                :key="symbol.id"
                type="button"
                class="symbols__key"
                :aria-label="t(`profile.symbols.s${symbol.id}`)"
                :disabled="isDisabled || chosen.length >= SYMBOL_MAX_LENGTH"
                @click="pick(symbol.id)"
            >
                <svg viewBox="0 0 24 24" width="44" height="44" aria-hidden="true">
                    <path :d="SYMBOL_PATHS[symbol.shape]" :fill="symbol.fill" stroke="var(--ink)" stroke-width="1.6" stroke-linejoin="round" />
                </svg>
                <span>{{ t(`profile.symbols.s${symbol.id}`) }}</span>
            </button>
        </div>
        <div class="row symbols__actions">
            <AppButton variant="secondary" size="sm" icon="back" :disabled="isDisabled || chosen === ''" @click="clear">
                {{ t('profile.symbols.clear') }}
            </AppButton>
            <AppButton icon="check" :disabled="isDisabled || !isComplete" @click="confirm">{{ t('profile.symbols.ok') }}</AppButton>
        </div>
    </div>
</template>

<script setup lang="ts">
const SYMBOL_PATHS: Record<SymbolShape, string> = {
    star: 'M12 2.5l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.7 5.9 21.1l1.4-6.8L2.2 9.6l6.9-.8z',
    circle: 'M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0-18z',
    heart: 'M12 21C5 15.5 3 12 3 8.8A4.8 4.8 0 0 1 12 6.5 4.8 4.8 0 0 1 21 8.8C21 12 19 15.5 12 21z',
    square: 'M4 4h16v16H4z',
    triangle: 'M12 3L22 20H2z',
    diamond: 'M12 2l9 10-9 10-9-10z',
}

const { isDisabled = false } = defineProps<{ isDisabled?: boolean }>()
const emit = defineEmits<{ submit: [value: string]; clear: [] }>()

const { t } = useI18n()
const { play } = useSoundCues()

const chosen = ref('')

const slotCount = computed(() => Math.max(SYMBOL_MIN_LENGTH, chosen.value.length))
const isComplete = computed(() => chosen.value.length >= SYMBOL_MIN_LENGTH)

const symbolAt = (index: number): ISymbol => SYMBOLS[Number(chosen.value[index])] ?? SYMBOLS[0]!

const pick = (id: number): void => {
    if (chosen.value.length >= SYMBOL_MAX_LENGTH) {
        return
    }
    chosen.value += String(id)
    play('button')
}

const clear = (): void => {
    chosen.value = ''
    emit('clear')
}

const confirm = (): void => {
    if (isComplete.value) {
        emit('submit', chosen.value)
    }
}

defineExpose({ clear })
</script>

<style scoped>
.symbols {
    align-items: center;
}

.symbols__slots {
    display: flex;
    gap: 10px;
}

.symbols__slot {
    width: 46px;
    height: 46px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: var(--outline) solid var(--ink);
    border-radius: 14px;
    background: var(--paper);
}

.symbols__pop {
    animation: pop-in 0.25s ease-out;
}

.symbols__grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(84px, 104px));
    gap: 14px;
}

.symbols__key {
    aspect-ratio: 1;
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    border: var(--outline) solid var(--ink);
    border-radius: 24px;
    background: var(--paper);
    box-shadow: var(--shadow-lg);
    color: var(--ink);
    font: 700 0.9375rem/1.1 var(--font-title);
    cursor: pointer;
    transition:
        transform 0.15s ease-out,
        box-shadow 0.15s ease-out;
}

.symbols__key:active:not(:disabled) {
    transform: translate(3px, 4px);
    box-shadow: var(--shadow-press);
}

.symbols__key:disabled {
    background: var(--grey);
    border-color: var(--grey-line);
    box-shadow: none;
    cursor: not-allowed;
}

.symbols__actions {
    justify-content: center;
}

@media (prefers-reduced-motion: reduce) {
    .symbols__pop,
    .symbols__key {
        animation: none;
        transition: none;
    }
}
</style>
