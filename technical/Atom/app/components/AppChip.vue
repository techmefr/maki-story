<template>
    <button v-bind="$attrs" type="button" class="chip" :class="{ 'chip--on': selected }" :aria-pressed="selected ? 'true' : 'false'" :disabled="disabled">
        <slot />
    </button>
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false })

defineProps<{ selected?: boolean; disabled?: boolean }>()
</script>
