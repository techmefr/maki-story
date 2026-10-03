<template>
    <button
        v-bind="$attrs"
        type="button"
        role="switch"
        class="toggle"
        :aria-checked="modelValue ? 'true' : 'false'"
        :disabled="disabled"
        @click="emit('update:modelValue', !modelValue)"
    >
        <span class="toggle__track" aria-hidden="true"><span class="toggle__thumb" /></span>
        <span><slot /></span>
    </button>
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false })

defineProps<{ modelValue: boolean; disabled?: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()
</script>
