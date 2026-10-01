<template>
    <div class="stack" style="gap: 8px">
        <span class="label">Ton (facultatif)</span>
        <div class="row row--wrap" role="group" aria-label="Ton">
            <button
                v-for="option in TONES"
                :key="option.id"
                type="button"
                class="chip"
                :class="{ 'chip--on': modelValue === option.label }"
                :aria-pressed="modelValue === option.label"
                @click="toggle(option.label)"
            >
                {{ option.label }}
            </button>
            <button type="button" class="chip" :class="{ 'chip--on': isOther }" :aria-pressed="isOther" @click="isFree = !isFree">
                Autre…
            </button>
        </div>
        <input
            v-if="isOther"
            class="input"
            aria-label="Ton libre"
            placeholder="Fatigué, solennel…"
            :value="modelValue"
            @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        />
    </div>
</template>

<script setup lang="ts">
const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const isFree = ref(false)

const isPreset = computed(() => TONES.some(option => option.label === props.modelValue))
const isOther = computed(() => isFree.value || (props.modelValue !== '' && !isPreset.value))

const toggle = (label: string): void => {
    isFree.value = false
    emit('update:modelValue', props.modelValue === label ? '' : label)
}
</script>
