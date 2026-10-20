<template>
    <div v-if="isSupported" class="stack update-action">
        <AppButton variant="secondary" icon="download" is-block :disabled="isChecking || isApplying" data-testid="app-update" @click="apply">
            {{ t(isChecking ? 'shell.update.checking' : isApplying ? 'shell.update.applying' : 'shell.update.action') }}
        </AppButton>
        <p v-if="status !== 'idle' && !isAvailable" class="muted" role="status">{{ t(`shell.update.${status}`) }}</p>
        <p v-if="status === 'failed' && isAvailable" class="error" role="alert">{{ t('shell.update.failed') }}</p>
    </div>
</template>

<script setup lang="ts">
import { useAppUpdate } from '../composables/useAppUpdate'
const { t } = useI18n()
const { isSupported, isChecking, isApplying, isAvailable, status, apply } = useAppUpdate()
</script>

<style scoped>
.update-action { gap: 8px; }
.update-action p { margin: 0; }
</style>
