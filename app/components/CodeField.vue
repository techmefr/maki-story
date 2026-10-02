<template>
    <div class="stack" style="gap: 8px">
        <div v-if="role === 'child'" class="stack" style="gap: 6px">
            <span class="label">{{ label ?? t('profile.code.defaultLabel') }}</span>
            <p class="muted">{{ t('profile.code.symbolsHint') }}</p>
            <SymbolPad :key="padKey" @submit="onSymbols" @clear="emit('update:modelValue', null)" />
            <p v-if="modelValue" class="muted" role="status">{{ t('profile.code.symbolsSaved') }}</p>
        </div>
        <label v-else class="stack" style="gap: 6px">
            <span class="label">{{ label ?? t('profile.code.defaultLabel') }}</span>
            <input
                class="input"
                type="password"
                inputmode="numeric"
                autocomplete="off"
                :maxlength="PIN_MAX_LENGTH"
                :placeholder="t('profile.code.placeholder', { min: PIN_MIN_LENGTH, max: PIN_MAX_LENGTH })"
                :value="pinValue"
                @input="onPin"
            />
        </label>
    </div>
</template>

<script setup lang="ts">
const { role = 'relative', label } = defineProps<{ modelValue: IMemberCodeInput | null; role?: MemberRole; label?: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: IMemberCodeInput | null] }>()

const { t } = useI18n()

const pinValue = ref('')
const padKey = ref(0)

watch(
    () => role,
    () => {
        pinValue.value = ''
        padKey.value += 1
        emit('update:modelValue', null)
    },
)

const onPin = (event: Event): void => {
    pinValue.value = (event.target as HTMLInputElement).value.replace(/[^0-9]/g, '')
    emit('update:modelValue', isValidCodeValue('pin', pinValue.value) ? { kind: 'pin', value: pinValue.value } : null)
}

const onSymbols = (value: string): void => {
    emit('update:modelValue', isValidCodeValue('symbols', value) ? { kind: 'symbols', value } : null)
}
</script>
