<template>
    <div class="pad stack" @keydown="onKeydown">
        <div class="pad__dots" aria-hidden="true">
            <span v-for="slot in PIN_MAX_LENGTH" :key="slot" class="pad__dot" :class="{ 'pad__dot--on': slot <= value.length }" />
        </div>
        <p class="sr-only" role="status" aria-live="polite">{{ value.length }} sur {{ PIN_MAX_LENGTH }} chiffres saisis</p>
        <div class="pad__grid">
            <button
                v-for="digit in digits"
                :key="digit"
                type="button"
                class="pad__key"
                :aria-label="`Chiffre ${digit}`"
                :disabled="isDisabled || value.length >= PIN_MAX_LENGTH"
                @click="push(digit)"
            >
                {{ digit }}
            </button>
            <button type="button" class="pad__key pad__key--soft" aria-label="Effacer le dernier chiffre" :disabled="isDisabled || value === ''" @click="pop">
                <AppIcon name="back" :size="26" />
            </button>
            <button type="button" class="pad__key" aria-label="Chiffre 0" :disabled="isDisabled || value.length >= PIN_MAX_LENGTH" @click="push('0')">
                0
            </button>
            <button type="button" class="pad__key pad__key--ok" :disabled="isDisabled || value.length < PIN_MIN_LENGTH" @click="submit">
                <AppIcon name="check" :size="26" />
                <span class="sr-only">Valider</span>
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
const { isDisabled = false } = defineProps<{ isDisabled?: boolean }>()
const emit = defineEmits<{ submit: [value: string] }>()

const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9']
const value = ref('')

const push = (digit: string): void => {
    if (value.value.length < PIN_MAX_LENGTH) {
        value.value += digit
    }
}

const pop = (): void => {
    value.value = value.value.slice(0, -1)
}

const submit = (): void => {
    if (value.value.length >= PIN_MIN_LENGTH && !isDisabled) {
        emit('submit', value.value)
    }
}

const clear = (): void => {
    value.value = ''
}

const onKeydown = (event: KeyboardEvent): void => {
    if (isDisabled) {
        return
    }
    if (/^[0-9]$/.test(event.key)) {
        push(event.key)
    } else if (event.key === 'Backspace') {
        pop()
    } else if (event.key === 'Enter' && value.value.length >= PIN_MIN_LENGTH) {
        event.preventDefault()
        submit()
    }
}

defineExpose({ clear })
</script>

<style scoped>
.pad {
    align-items: center;
}

.pad__dots {
    display: flex;
    gap: 12px;
    justify-content: center;
}

.pad__dot {
    width: 18px;
    height: 18px;
    border: 3px solid var(--ink);
    border-radius: 50%;
    background: var(--paper);
}

.pad__dot--on {
    background: var(--ink);
}

.pad__grid {
    display: grid;
    grid-template-columns: repeat(3, 76px);
    gap: 12px;
}

.pad__key {
    width: 76px;
    height: 76px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 3px solid var(--ink);
    border-radius: 22px;
    background: var(--paper);
    box-shadow: 3px 3px 0 var(--ink);
    font: 700 30px/1 var(--font-title);
    color: var(--ink);
    cursor: pointer;
}

.pad__key:focus-visible {
    outline: 4px solid var(--sky);
    outline-offset: 3px;
}

.pad__key:active:not(:disabled) {
    transform: translate(3px, 3px);
    box-shadow: 0 0 0 var(--ink);
}

.pad__key:disabled {
    opacity: 0.45;
    cursor: not-allowed;
}

.pad__key--soft {
    background: var(--cream);
}

.pad__key--ok {
    background: var(--mint);
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
