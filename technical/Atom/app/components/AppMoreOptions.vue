<template>
    <section class="more stack">
        <AppButton variant="secondary" size="sm" class="more__toggle" :aria-expanded="isOpen" :aria-controls="panelId" :data-testid="testId" @click="isOpen = !isOpen">
            <AppIcon name="chevron-down" :size="18" class="more__chevron" :class="{ 'more__chevron--open': isOpen }" />{{ t('common.moreOptions') }}
        </AppButton>
        <div v-show="isOpen" :id="panelId" class="stack">
            <slot />
        </div>
    </section>
</template>

<script setup lang="ts">
const { testId = 'more-options-toggle' } = defineProps<{ testId?: string }>()

const { t } = useI18n()
const panelId = useId()
const isOpen = ref(false)
</script>

<style scoped>
.more__toggle {
    align-self: flex-start;
}

.more__chevron {
    transition: rotate 0.2s ease;
}

.more__chevron--open {
    rotate: 180deg;
}

@media (prefers-reduced-motion: reduce) {
    .more__chevron {
        transition: none;
    }
}
</style>
