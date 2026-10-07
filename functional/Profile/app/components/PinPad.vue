<template>
    <div class="pad stack" :class="`pad--${variant}`" @keydown="onKeydown">
        <div class="pad__dots" aria-hidden="true">
            <span v-for="slot in PIN_MAX_LENGTH" :key="slot" class="pad__dot" :class="{ 'pad__dot--on': slot <= value.length }" />
        </div>
        <p class="sr-only" role="status" aria-live="polite">{{ t('profile.pad.progress', { count: value.length, max: PIN_MAX_LENGTH }) }}</p>
        <div class="pad__grid">
            <button
                v-for="digit in digits"
                :key="digit"
                type="button"
                class="pad__key"
                :aria-label="t('profile.pad.digit', { digit })"
                :disabled="isDisabled || value.length >= PIN_MAX_LENGTH"
                @click="push(digit)"
            >
                {{ digit }}
            </button>
            <button
                v-if="variant === 'compact'"
                type="button"
                class="pad__key pad__key--cancel"
                :aria-label="t('common.cancel')"
                :disabled="isDisabled"
                @click="emit('cancel')"
            >
                <AppIcon name="close" :size="26" />
            </button>
            <button
                v-else
                type="button"
                class="pad__key pad__key--soft"
                :aria-label="t('profile.pad.erase')"
                :disabled="isDisabled || value === ''"
                @click="pop"
            >
                <AppIcon name="back" :size="34" />
            </button>
            <button type="button" class="pad__key" :aria-label="t('profile.pad.digit', { digit: '0' })" :disabled="isDisabled || value.length >= PIN_MAX_LENGTH" @click="push('0')">
                0
            </button>
            <button
                v-if="variant === 'compact'"
                type="button"
                class="pad__key pad__key--soft"
                :aria-label="t('profile.pad.erase')"
                :disabled="isDisabled || value === ''"
                @click="pop"
            >
                <AppIcon name="back" :size="26" />
            </button>
            <button v-else type="button" class="pad__key pad__key--ok" :disabled="isDisabled || value.length < minLength" @click="submit">
                <AppIcon name="check" :size="38" />
                <span class="sr-only">{{ t('profile.pad.submit') }}</span>
            </button>
        </div>
        <AppButton v-if="variant === 'compact'" icon="check" class="pad__submit" :disabled="isDisabled || value.length < minLength" @click="submit">
            {{ t('profile.pad.submit') }}
        </AppButton>
    </div>
</template>

<script setup lang="ts">
const { isDisabled = false, minLength = PIN_MIN_LENGTH, variant = 'default' } = defineProps<{
    isDisabled?: boolean
    minLength?: number
    variant?: 'default' | 'compact'
}>()
const emit = defineEmits<{ submit: [value: string]; cancel: [] }>()
const { t } = useI18n()

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
    if (value.value.length >= minLength && !isDisabled) {
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
    } else if (event.key === 'Enter' && value.value.length >= minLength) {
        event.preventDefault()
        submit()
    }
}

defineExpose({ clear })
</script>

<style scoped>
.pad {
    align-items: center;
    width: 100%;
    gap: 22px;
}

.pad__dots {
    display: flex;
    gap: 12px;
    justify-content: center;
}

.pad__dot {
    width: 20px;
    height: 20px;
    border: var(--outline) solid var(--ink);
    border-radius: 50%;
    background: var(--bg);
}

.pad__dot--on {
    background: var(--ink);
}

.pad__grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
    width: 100%;
    max-width: min(340px, 36vh);
}

.pad__key {
    aspect-ratio: 1;
    min-height: 56px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: var(--outline) solid var(--ink);
    border-radius: 24px;
    background: var(--paper);
    box-shadow: var(--shadow-lg);
    font: 700 2.5rem/1 var(--font-title);
    color: var(--ink);
    cursor: pointer;
    transition:
        transform 0.15s ease-out,
        box-shadow 0.15s ease-out;
}

.pad__key:active:not(:disabled) {
    transform: translate(3px, 4px);
    box-shadow: var(--shadow-press);
}

.pad__key:disabled {
    background: var(--grey);
    border-color: var(--grey-line);
    box-shadow: none;
    color: var(--ink-soft);
    cursor: not-allowed;
}

.pad__key--ok {
    background: var(--mint);
    color: var(--on-accent);
}

.pad__key--ok:disabled {
    background: var(--mint-soft);
    border-color: var(--grey-line);
    color: var(--on-accent);
}

.pad--compact {
    gap: 16px;
}

.pad--compact .pad__dot {
    width: 22px;
    height: 22px;
    border-color: var(--on-accent);
    background: var(--pad-paper, var(--bg));
}

.pad--compact .pad__dot--on {
    background: var(--on-accent);
}

.pad--compact .pad__grid {
    gap: 10px;
    max-width: min(300px, 36vh);
}

.pad--compact .pad__key {
    aspect-ratio: 1.3;
    border-color: var(--on-accent);
    border-radius: 20px;
    background: var(--pad-paper, var(--paper));
    box-shadow: var(--shadow);
    color: var(--on-accent);
    font-size: 1.875rem;
}

.pad--compact .pad__key--cancel {
    background: var(--sky);
}

.pad--compact .pad__key--soft {
    background: var(--danger-soft);
}

.pad--compact .pad__key:disabled {
    background: var(--grey);
    border-color: var(--grey-line);
    box-shadow: none;
    color: var(--grey-ui-ink);
    opacity: 0.8;
}

.pad__submit {
    width: 100%;
    max-width: 300px;
}

[dir='rtl'] .pad__key :deep(svg) {
    transform: scaleX(-1);
}

[dir='rtl'] .pad__key--ok :deep(svg),
[dir='rtl'] .pad__key--cancel :deep(svg) {
    transform: none;
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
