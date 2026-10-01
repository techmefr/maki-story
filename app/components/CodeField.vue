<template>
    <div class="stack" style="gap: 8px">
        <div v-if="canUseShapes" class="row row--wrap" role="group" aria-label="Type de code">
            <button type="button" class="chip" :class="{ 'chip--on': kind === 'pin' }" :aria-pressed="kind === 'pin'" @click="setKind('pin')">
                Chiffres
            </button>
            <button type="button" class="chip" :class="{ 'chip--on': kind === 'shapes' }" :aria-pressed="kind === 'shapes'" @click="setKind('shapes')">
                Formes
            </button>
        </div>
        <label v-if="kind === 'pin'" class="stack" style="gap: 6px">
            <span class="label">{{ label }}</span>
            <input
                class="input"
                type="password"
                inputmode="numeric"
                autocomplete="off"
                :maxlength="PIN_MAX_LENGTH"
                :placeholder="`${PIN_MIN_LENGTH} à ${PIN_MAX_LENGTH} chiffres`"
                :value="pinValue"
                @input="onPin"
            />
        </label>
        <div v-else class="stack" style="gap: 6px">
            <span class="label">{{ label }}</span>
            <p class="muted">Choisis 3 formes parmi 4, dans l’ordre.</p>
            <ShapePad :key="shapeKey" @submit="onShapes" @clear="emit('update:modelValue', null)" />
            <p v-if="modelValue" class="muted" role="status">Formes enregistrées.</p>
        </div>
    </div>
</template>

<script setup lang="ts">
const { canUseShapes = false, label = 'Code' } = defineProps<{ modelValue: IMemberCodeInput | null; canUseShapes?: boolean; label?: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: IMemberCodeInput | null] }>()

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
