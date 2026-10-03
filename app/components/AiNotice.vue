<template>
    <p class="card ai-notice" role="note">
        <AppIcon name="sparkles" :size="20" />
        <span><strong>{{ t('ai.notice.label') }}</strong> {{ text ?? t('ai.notice.default') }}</span>
    </p>
</template>

<script setup lang="ts">
const { text } = defineProps<{ text?: string }>()

const { t } = useI18n()
</script>

<style scoped>
.ai-notice {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    background: #FFF3DC;
    margin: 0;
}
</style>
