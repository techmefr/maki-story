<template>
    <div class="symbols stack">
        <div class="symbols__slots" aria-hidden="true">
            <span v-for="slot in SYMBOL_CODE_LENGTH" :key="slot" class="symbols__slot" :style="slotStyle(slot - 1)">
                <svg v-if="chosen[slot - 1] !== undefined" class="symbols__pop" viewBox="0 0 24 24" width="38" height="38">
                    <path :d="SYMBOL_PATHS[symbolAt(slot - 1).shape]" fill="currentColor" />
                </svg>
            </span>
        </div>
        <p class="sr-only" role="status" aria-live="polite">{{ t('profile.symbols.chosen', { count: chosen.length, total: SYMBOL_CODE_LENGTH }) }}</p>
        <div class="symbols__grid">
            <button
                v-for="symbol in SYMBOLS"
                :key="symbol.id"
                type="button"
                class="symbols__key"
                :style="{ background: getVoiceColor(symbol.color).hex }"
                :aria-label="t(`profile.symbols.s${symbol.id}`)"
                :disabled="isDisabled || chosen.length >= SYMBOL_CODE_LENGTH"
                @click="pick(symbol.id)"
            >
                <svg viewBox="0 0 24 24" width="48" height="48" aria-hidden="true">
                    <path :d="SYMBOL_PATHS[symbol.shape]" fill="#FFF3DC" stroke="#1E1A3F" stroke-width="1.6" stroke-linejoin="round" />
                </svg>
            </button>
        </div>
        <AppButton variant="secondary" size="sm" :disabled="isDisabled || chosen === ''" @click="clear">
            <AppIcon name="back" :size="18" />
            {{ t('profile.symbols.clear') }}
        </AppButton>
    </div>
</template>

<script setup lang="ts">
const SYMBOL_PATHS: Record<string, string> = {
    star: 'M12 2l3 7 7.5.6-5.7 4.9 1.8 7.3L12 18l-6.6 3.8 1.8-7.3L1.5 9.6 9 9z',
    moon: 'M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z',
    heart: 'M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.7A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11z',
    sun: 'M12 7a5 5 0 1 0 0 10a5 5 0 0 0 0-10zM12 1l1.6 3.4h-3.2zM12 23l-1.6-3.4h3.2zM1 12l3.4-1.6v3.2zM23 12l-3.4 1.6v-3.2z',
    cloud: 'M7 19a4.5 4.5 0 0 1-.6-8.96A6 6 0 0 1 18 9.5a4.7 4.7 0 0 1-.5 9.5z',
    flower: 'M12 9a3 3 0 1 0 0 6a3 3 0 0 0 0-6zM12 2a3 3 0 0 1 0 6a3 3 0 0 1 0-6zM12 16a3 3 0 0 1 0 6a3 3 0 0 1 0-6zM2 12a3 3 0 0 1 6 0a3 3 0 0 1-6 0zM16 12a3 3 0 0 1 6 0a3 3 0 0 1-6 0z',
}

const { isDisabled = false } = defineProps<{ isDisabled?: boolean }>()
const emit = defineEmits<{ submit: [value: string]; clear: [] }>()

const { t } = useI18n()
const { play } = useSoundCues()

const chosen = ref('')

const symbolAt = (index: number): ISymbol => SYMBOLS[Number(chosen.value[index])] ?? SYMBOLS[0]!

const slotStyle = (index: number): Record<string, string> => {
    return chosen.value[index] === undefined ? {} : { background: getVoiceColor(symbolAt(index).color).hex, borderStyle: 'solid' }
}

const pick = (id: number): void => {
    if (chosen.value.length >= SYMBOL_CODE_LENGTH) {
        return
    }
    chosen.value += String(id)
    play('button')
    if (chosen.value.length === SYMBOL_CODE_LENGTH) {
        emit('submit', chosen.value)
    }
}

const clear = (): void => {
    chosen.value = ''
    emit('clear')
}

defineExpose({ clear })
</script>

<style scoped>
.symbols {
    align-items: center;
}

.symbols__slots {
    display: flex;
    gap: 12px;
}

.symbols__slot {
    width: 58px;
    height: 58px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 3px dashed var(--ink);
    border-radius: 18px;
    background: var(--paper);
    color: #FFF3DC;
}

.symbols__pop {
    animation: pop-in 0.25s ease-out;
    filter: drop-shadow(0 0 1px #1E1A3F);
}

.symbols__grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(84px, 104px));
    gap: 12px;
}

.symbols__key {
    aspect-ratio: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 3px solid var(--ink);
    border-radius: 26px;
    box-shadow: 3px 3px 0 var(--ink);
    color: var(--ink);
    cursor: pointer;
    transition: transform 0.12s ease;
}

.symbols__key:hover:not(:disabled) {
    transform: scale(1.05) rotate(-2deg);
}

.symbols__key:active:not(:disabled) {
    transform: translate(3px, 3px);
    box-shadow: 0 0 0 var(--ink);
}

.symbols__key:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

@media (prefers-reduced-motion: reduce) {
    .symbols__pop {
        animation: none;
    }

    .symbols__key {
        transition: none;
    }

    .symbols__key:hover:not(:disabled) {
        transform: none;
    }
}

.sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
}
</style>
