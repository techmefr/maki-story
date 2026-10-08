<template>
    <AppButton variant="secondary" icon="back" :to="to" class="back-link"><slot>{{ t('common.back') }}</slot></AppButton>
</template>

<script setup lang="ts">
defineProps<{ to?: string }>()
const { t } = useI18n()
</script>
