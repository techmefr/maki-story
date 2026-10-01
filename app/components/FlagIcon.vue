<template>
    <svg
        class="flag"
        :width="size"
        :height="size * 0.667"
        viewBox="0 0 60 40"
        role="img"
        :aria-label="label"
        :data-flag="codes.join('-')"
    >
        <defs>
            <clipPath :id="`${uid}-a`"><rect width="30" height="40" /></clipPath>
            <clipPath :id="`${uid}-b`"><rect x="30" width="30" height="40" /></clipPath>
        </defs>
        <g v-if="codes.length < 2">
            <FlagArt :code="codes[0] ?? ''" />
        </g>
        <template v-else>
            <g :clip-path="`url(#${uid}-a)`"><FlagArt :code="codes[0]!" /></g>
            <g :clip-path="`url(#${uid}-b)`"><FlagArt :code="codes[1]!" /></g>
            <line x1="30" y1="0" x2="30" y2="40" stroke="#1F1B3A" stroke-width="2" />
        </template>
        <rect x="1" y="1" width="58" height="38" rx="3" fill="none" stroke="#1F1B3A" stroke-width="2" />
    </svg>
</template>

<script setup lang="ts">
const { codes, size = 64 } = defineProps<{ codes: string[]; size?: number }>()

const uid = useId()
const { t } = useI18n()
const label = computed(() => {
    const labels = codes.map(code => LANGUAGES.find(item => item.code === code)?.label ?? code)
    return labels.length === 2 ? t('playback.pair', { first: labels[0]!, second: labels[1]! }) : labels.join(', ')
})
</script>

<style scoped>
.flag {
    display: block;
    flex: none;
}
</style>
