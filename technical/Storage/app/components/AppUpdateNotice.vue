<template>
    <aside v-if="isAvailable && !isDismissed" class="update-notice" :aria-label="t('shell.update.available')">
        <p role="status">{{ t('shell.update.available') }}</p>
        <AppUpdateAction />
        <AppButton variant="tertiary" size="sm" @click="isDismissed = true">{{ t('shell.update.later') }}</AppButton>
    </aside>
</template>

<script setup lang="ts">
import AppUpdateAction from './AppUpdateAction.vue'
import { useAppUpdate } from '../composables/useAppUpdate'
const { t } = useI18n()
const { isAvailable } = useAppUpdate()
const isDismissed = useState('app-update-dismissed', () => false)
</script>

<style scoped>
.update-notice { position: fixed; inset-block-start: calc(env(safe-area-inset-top) + 12px); inset-inline: 12px; margin-inline: auto; z-index: 600; max-width: 520px; padding: 16px; border: 3px solid var(--ink); border-radius: 24px; background: var(--paper); color: var(--ink); box-shadow: var(--shadow-lg); max-height: calc(100dvh - 24px); overflow: auto; }
.update-notice p { margin: 0 0 12px; font-weight: 600; }
</style>
