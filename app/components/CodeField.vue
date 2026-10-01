<template>
    <div class="stack" style="gap: 8px">
        <div v-if="canUseShapes" class="row row--wrap" role="group" :aria-label="t('profile.code.kind')">
            <button type="button" class="chip" :class="{ 'chip--on': kind === 'pin' }" :aria-pressed="kind === 'pin'" @click="setKind('pin')">
                {{ t('profile.code.digits') }}
            </button>
            <button type="button" class="chip" :class="{ 'chip--on': kind === 'shapes' }" :aria-pressed="kind === 'shapes'" @click="setKind('shapes')">
                {{ t('profile.code.shapes') }}
            </button>
        </div>
        <label v-if="kind === 'pin'" class="stack" style="gap: 6px">
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
        <div v-else class="stack" style="gap: 6px">
            <span class="label">{{ label ?? t('profile.code.defaultLabel') }}</span>
            <p class="muted">{{ t('profile.code.shapesHint') }}</p>
            <ShapePad :key="shapeKey" @submit="onShapes" @clear="emit('update:modelValue', null)" />
            <p v-if="modelValue" class="muted" role="status">{{ t('profile.code.shapesSaved') }}</p>
        </div>
    </div>
</template>

<script setup lang="ts">
const { canUseShapes = false, label } = defineProps<{ modelValue: IMemberCodeInput | null; canUseShapes?: boolean; label?: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: IMemberCodeInput | null] }>()

const { t } = useI18n()

const kind = ref<MemberCodeKind>('pin')
const pinValue = ref('')
const shapeKey = ref(0)

const setKind = (next: MemberCodeKind): void => {
    kind.value = next
    pinValue.value = ''
    shapeKey.value += 1
    emit('update:modelValue', null)
}

watch(
    () => canUseShapes,
    isAllowed => {
        if (!isAllowed && kind.value === 'shapes') {
            setKind('pin')
        }
    },
)

const onPin = (event: Event): void => {
    pinValue.value = (event.target as HTMLInputElement).value.replace(/[^0-9]/g, '')
    emit('update:modelValue', isValidCodeValue('pin', pinValue.value) ? { kind: 'pin', value: pinValue.value } : null)
}

const onShapes = (value: string): void => {
    emit('update:modelValue', isValidCodeValue('shapes', value) ? { kind: 'shapes', value } : null)
}
</script>
