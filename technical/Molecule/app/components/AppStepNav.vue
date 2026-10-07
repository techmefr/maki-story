<template>
    <div class="step-nav">
        <AppButton v-if="canBack" variant="secondary" class="step-nav__action" :disabled="isBusy" data-testid="step-back" @click="emit('back')">
            {{ t('common.back') }}
        </AppButton>
        <AppButton class="step-nav__action step-nav__next" type="submit" :disabled="isDisabled || isBusy" :data-testid="nextTestId">
            {{ nextLabel }}
        </AppButton>
    </div>
</template>

<script setup lang="ts">
defineProps<{ nextLabel: string; canBack: boolean; isDisabled?: boolean; isBusy?: boolean; nextTestId?: string }>()

const emit = defineEmits<{ back: [] }>()

const { t } = useI18n()
</script>

<style scoped>
.step-nav {
    display: flex;
    gap: 10px;
}

.step-nav__action {
    min-height: 52px;
}

.step-nav__next {
    flex: 1;
}
</style>
