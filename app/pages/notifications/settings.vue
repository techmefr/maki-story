<template>
    <div class="stack narrow">
        <BackLink to="/notifications" />
        <h1 class="title">{{ t('profile.menu.notifications') }}</h1>
        <AppButton variant="secondary" icon="bell" to="/permissions">{{ t('alerts.enable') }}</AppButton>
        <ProfileNotificationPrefs />
    </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
</script>
