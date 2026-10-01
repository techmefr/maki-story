<template>
    <div class="row row--wrap" role="group" :aria-label="label">
        <button
            v-for="language in LANGUAGES"
            :key="language.code"
            type="button"
            class="chip lang"
            :class="{ 'chip--on': model.includes(language.code) }"
            :aria-pressed="model.includes(language.code)"
            :disabled="isDisabled"
            :lang="language.code"
            @click="toggle(language.code)"
        >
            <span aria-hidden="true">{{ language.flag }}</span>
            {{ language.label }}
        </button>
    </div>
</template>

<script setup lang="ts">
const { label, isDisabled = false } = defineProps<{ label: string; isDisabled?: boolean }>()
const model = defineModel<string[]>({ required: true })

const toggle = (code: string): void => {
    model.value = model.value.includes(code) ? model.value.filter(item => item !== code) : [...model.value, code]
}
</script>

<style scoped>
.lang {
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
}
</style>
