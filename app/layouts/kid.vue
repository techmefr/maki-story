<template>
    <div class="kid shell">
        <a class="skip-link" href="#main">{{ t('shell.skip') }}</a>
        <SideRail />
        <div class="app">
            <AppHeader />
            <main id="main" tabindex="-1">
                <slot />
            </main>
        </div>
        <TabBar />
        <OutboxStatus />
        <ProfileMenu />
        <ProfileCard />
        <FeedbackSheet />
        <ProfileSwitcher />
    </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
</script>
