<template>
    <button
        v-bind="$attrs"
        type="button"
        role="checkbox"
        class="checkbox"
        :aria-checked="isChecked ? 'true' : 'false'"
        :disabled="disabled"
        @click="toggle"
    >
        <span class="checkbox__box" aria-hidden="true"><AppIcon v-if="isChecked" name="check" :size="20" :stroke-width="3.4" /></span>
        <span><slot /></span>
    </button>
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false })

const props = defineProps<{ modelValue: boolean | string[]; value?: string; disabled?: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean | string[]] }>()

const isChecked = computed(() =>
    Array.isArray(props.modelValue) ? props.value !== undefined && props.modelValue.includes(props.value) : props.modelValue,
)

const toggle = (): void => {
    if (!Array.isArray(props.modelValue)) {
        emit('update:modelValue', !props.modelValue)
        return
    }
    const value = props.value ?? ''
    emit('update:modelValue', props.modelValue.includes(value) ? props.modelValue.filter(item => item !== value) : [...props.modelValue, value])
}
</script>
