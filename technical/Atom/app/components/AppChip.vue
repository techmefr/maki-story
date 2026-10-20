<template>
    <button v-bind="$attrs" type="button" class="chip" :class="{ 'chip--on': selected }" :aria-pressed="$attrs.role === 'tab' ? undefined : selected ? 'true' : 'false'" :disabled="disabled">
        <slot />
    </button>
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false })

defineProps<{ selected?: boolean; disabled?: boolean }>()
</script>

<style scoped>
.chip.chip--on {
    background: var(--chip-on-bg);
    color: var(--chip-on-ink);
}
</style>
