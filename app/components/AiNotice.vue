<template>
    <p class="card ai-notice" role="note">
        <AppIcon name="sparkles" :size="20" />
        <span><strong>Proposé par l’IA.</strong> {{ text }}</span>
    </p>
</template>

<script setup lang="ts">
const { text = 'Relis tout avec attention et corrige ce qui doit l’être avant de continuer.' } = defineProps<{ text?: string }>()
</script>

<style scoped>
.ai-notice {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    background: #fff4d9;
    margin: 0;
}
</style>
