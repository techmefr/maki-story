<template>
    <div class="slider" :class="{ 'slider--disabled': disabled }">
        <AppIcon v-if="startIcon" :name="startIcon" :size="22" />
        <div
            v-bind="$attrs"
            ref="track"
            class="slider__track"
            role="slider"
            :tabindex="disabled ? -1 : 0"
            :aria-valuemin="min"
            :aria-valuemax="max"
            :aria-valuenow="modelValue"
            :aria-valuetext="valueText"
            :aria-disabled="disabled ? 'true' : undefined"
            @pointerdown="onDown"
            @pointermove="onMove"
            @pointerup="onUp"
            @pointercancel="onUp"
            @keydown="onKey"
        >
            <div class="slider__rail">
                <div class="slider__fill" :style="{ width: percent + '%' }" />
                <div class="slider__thumb" :style="{ insetInlineStart: percent + '%' }" />
            </div>
        </div>
        <AppIcon v-if="endIcon" :name="endIcon" :size="22" />
    </div>
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false })

const props = withDefaults(
    defineProps<{ modelValue: number; min?: number; max?: number; step?: number; disabled?: boolean; startIcon?: IconName; endIcon?: IconName; valueText?: string }>(),
    { min: 0, max: 1, step: 0.1 },
)
const emit = defineEmits<{ 'update:modelValue': [value: number] }>()

const track = ref<HTMLElement | null>(null)
const isDragging = ref(false)

const percent = computed(() => ((props.modelValue - props.min) / (props.max - props.min)) * 100)

const snap = (raw: number): number => {
    const stepped = Math.round((raw - props.min) / props.step) * props.step + props.min
    return Math.min(props.max, Math.max(props.min, Number(stepped.toFixed(4))))
}

const setFromPointer = (event: PointerEvent): void => {
    const element = track.value
    const rect = element?.getBoundingClientRect()
    if (!element || !rect || rect.width === 0) {
        return
    }
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
    const directed = getComputedStyle(element).direction === 'rtl' ? 1 - ratio : ratio
    emit('update:modelValue', snap(props.min + directed * (props.max - props.min)))
}

const onDown = (event: PointerEvent): void => {
    if (props.disabled) {
        return
    }
    isDragging.value = true
    track.value?.setPointerCapture(event.pointerId)
    setFromPointer(event)
}

const onMove = (event: PointerEvent): void => {
    if (isDragging.value) {
        setFromPointer(event)
    }
}

const onUp = (): void => {
    isDragging.value = false
}

const onKey = (event: KeyboardEvent): void => {
    if (props.disabled) {
        return
    }
    if (event.key === 'Home' || event.key === 'End') {
        event.preventDefault()
        emit('update:modelValue', event.key === 'Home' ? props.min : props.max)
        return
    }
    const deltas: Record<string, number> = { ArrowRight: props.step, ArrowUp: props.step, ArrowLeft: -props.step, ArrowDown: -props.step }
    const delta = deltas[event.key]
    if (delta !== undefined) {
        event.preventDefault()
        emit('update:modelValue', snap(props.modelValue + delta))
    }
}
</script>
