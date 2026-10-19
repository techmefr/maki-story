<template>
    <div class="stack narrow photo-prompt">
        <BackLink :to="homePath" />
        <AppPageIntro icon="camera" tone="pink" :title="t('home.grimace.title')" :hint="t('home.grimace.help')" />
        <section class="stack center card photo-prompt__capture" :aria-busy="isBusy">
            <PhotoCapture v-if="!isBusy" :frame-color="hex" @captured="save" />
            <p v-else role="status">{{ t('common.loading') }}</p>
            <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
        </section>
        <AppButton variant="secondary" icon="next" :to="homePath" :disabled="isBusy">{{ t('home.grimace.later') }}</AppButton>
    </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const { homePath, hex, isBusy, errorMessage, save } = useProfilePhotoPrompt()
</script>

<style scoped>
.photo-prompt { gap: 24px; }
.photo-prompt__capture { padding: 24px; border-radius: 28px; }
</style>
