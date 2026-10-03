<template>
    <div class="row row--wrap" role="tablist" :aria-label="label">
        <AppChip
            v-for="item in items"
            :key="item.id"
            role="tab"
            :selected="item.id === modelValue"
            :aria-selected="item.id === modelValue ? 'true' : 'false'"
            @click="emit('update:modelValue', item.id)"
        >
            {{ item.label }}
            <AppBadge v-if="item.missing" tone="warning">{{ item.missing }}</AppBadge>
        </AppChip>
        <slot name="append" />
    </div>
</template>

<script setup lang="ts">
export interface TabItem {
    id: string
    label: string
    missing?: number
}

defineProps<{ items: TabItem[]; modelValue: string; label: string }>()
const emit = defineEmits<{ 'update:modelValue': [id: string] }>()
</script>
