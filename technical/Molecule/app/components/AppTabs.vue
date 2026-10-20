<template>
    <div class="row row--wrap" role="tablist" :aria-label="label">
        <AppChip
            v-for="item in items"
            :key="item.id"
            role="tab"
            :selected="item.id === modelValue"
            :aria-selected="item.id === modelValue ? 'true' : 'false'"
            :tabindex="item.id === activeId ? 0 : -1"
            @keydown="onKeydown($event, item.id)"
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

const props = defineProps<{ items: TabItem[]; modelValue: string; label: string }>()
const activeId = computed(() => props.items.find(item => item.id === props.modelValue)?.id ?? props.items[0]?.id)
const emit = defineEmits<{ 'update:modelValue': [id: string] }>()

const onKeydown = (event: KeyboardEvent, id: string): void => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key) || props.items.length === 0) return
    event.preventDefault()
    const current = props.items.findIndex(item => item.id === id)
    const direction = getComputedStyle(event.currentTarget as HTMLElement).direction === 'rtl' ? -1 : 1
    const delta = (event.key === 'ArrowRight' ? 1 : -1) * direction
    const index = event.key === 'Home' ? 0 : event.key === 'End' ? props.items.length - 1 : (current + delta + props.items.length) % props.items.length
    const item = props.items[index]
    if (!item) return
    emit('update:modelValue', item.id)
    const buttons = (event.currentTarget as HTMLElement).parentElement?.querySelectorAll<HTMLElement>('[role="tab"]')
    buttons?.[index]?.focus()
}
</script>
