<template>
    <div ref="root" class="select">
        <button
            v-bind="$attrs"
            type="button"
            role="combobox"
            class="select__button"
            aria-haspopup="listbox"
            :aria-expanded="isOpen ? 'true' : 'false'"
            :aria-controls="listId"
            :disabled="disabled"
            @click="toggle"
            @keydown="onKey"
        >
            <span>{{ currentLabel }}</span>
            <AppIcon name="chevron-down" :size="20" />
        </button>
        <ul v-if="isOpen" :id="listId" class="select__list" role="listbox">
            <li
                v-for="(option, index) in options"
                :key="String(option.value)"
                role="option"
                class="select__option"
                :class="{ 'select__option--active': index === activeIndex }"
                :aria-selected="option.value === modelValue ? 'true' : 'false'"
                @click="choose(option.value)"
                @pointerenter="activeIndex = index"
            >
                <span>{{ option.label }}</span>
                <AppIcon v-if="option.value === modelValue" name="check" :size="18" />
            </li>
        </ul>
    </div>
</template>

<script setup lang="ts" generic="T extends string | number | null">
defineOptions({ inheritAttrs: false })

const props = defineProps<{ modelValue: T; options: { value: T; label: string }[]; disabled?: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: T] }>()

const listId = useId()
const root = ref<HTMLElement | null>(null)
const isOpen = ref(false)
const activeIndex = ref(0)

const currentLabel = computed(() => props.options.find(option => option.value === props.modelValue)?.label ?? '')

const open = (): void => {
    activeIndex.value = Math.max(
        0,
        props.options.findIndex(option => option.value === props.modelValue),
    )
    isOpen.value = true
}

const toggle = (): void => {
    if (isOpen.value) {
        isOpen.value = false
        return
    }
    open()
}

const choose = (value: T): void => {
    emit('update:modelValue', value)
    isOpen.value = false
}

const onKey = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
        isOpen.value = false
        return
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault()
        if (!isOpen.value) {
            open()
            return
        }
        const step = event.key === 'ArrowDown' ? 1 : -1
        activeIndex.value = (activeIndex.value + step + props.options.length) % props.options.length
        return
    }
    if (event.key === 'Enter' && isOpen.value) {
        event.preventDefault()
        const option = props.options[activeIndex.value]
        if (option) {
            choose(option.value)
        }
    }
}

const onOutside = (event: PointerEvent): void => {
    if (isOpen.value && root.value && !root.value.contains(event.target as Node)) {
        isOpen.value = false
    }
}

onMounted(() => document.addEventListener('pointerdown', onOutside))
onBeforeUnmount(() => document.removeEventListener('pointerdown', onOutside))
</script>
