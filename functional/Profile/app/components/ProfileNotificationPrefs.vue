<template>
    <div class="stack">
    <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
    <AppButton v-if="!isLoaded && !isBusy" icon="redo" @click="load">{{ t('common.retry') }}</AppButton>
    <ul class="npref" role="list" data-testid="menu-notifications">
        <li v-for="kind in kinds" :key="kind" class="npref__item" :data-testid="`pref-${kind}`">
            <span class="npref__label">{{ t(`alerts.kinds.${kind}`) }}</span>
            <div class="row row--wrap" role="group" :aria-label="t(`alerts.kinds.${kind}`)">
                <ProfileChip
                    v-for="channel in channels"
                    :key="channel"
                    is-small
                    :disabled="isBusy || !isLoaded"
                    :selected="isOn(kind, channel)"
                    :data-testid="`pref-${kind}-${channel}`"
                    @click="toggle(kind, channel)"
                >
                    {{ t(`alerts.channels.${channel}`) }}
                </ProfileChip>
            </div>
        </li>
    </ul>
    </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const kinds = NOTIFICATION_KINDS
const channels = PREFERENCE_CHANNELS
const { isBusy, isLoaded, errorMessage, isOn, load, toggle } = useNotificationPreferences()
onMounted(load)
</script>

<style scoped>
.npref {
    display: flex;
    flex-direction: column;
    gap: 14px;
    margin: 0;
    padding: 0;
    list-style: none;
}

.npref__item {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.npref__label {
    font: 700 1rem/1.2 var(--font-title);
}
</style>
