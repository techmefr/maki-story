<template>
    <div v-if="open" class="sheet-backdrop" @click.self="emit('close')">
        <div v-sheet="close" class="sheet stack" role="dialog" aria-modal="true" :aria-labelledby="titleId">
            <h2 :id="titleId" class="subtitle">{{ title }}</h2>
            <slot />
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{ open: boolean; title: string }>()
const emit = defineEmits<{ close: [] }>()

const titleId = useId()
const close = (): void => emit('close')
</script>
