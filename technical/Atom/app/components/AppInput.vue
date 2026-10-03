<template>
    <input v-bind="$attrs" class="input" :value="modelValue" @input="onInput" />
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false })

defineProps<{ modelValue?: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const onInput = (event: Event): void => {
    emit('update:modelValue', (event.target as HTMLInputElement).value)
}
</script>
