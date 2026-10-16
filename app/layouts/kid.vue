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

<style scoped>
.kid :deep(main) {
    min-width: 0;
}

.kid :deep(.title) {
    font-size: clamp(1.75rem, 5vw, 2.125rem);
}

.kid :deep(.btn) {
    border-radius: 28px;
}

.kid :deep(.tabbar__item) {
    min-height: 72px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-size: 1rem;
}

.kid :deep(.tabbar__item .icon) {
    flex: none;
}

@media (min-width: 1024px) {
    .kid :deep(.app) {
        padding: 28px 32px 64px;
        gap: 28px;
    }
}
</style>
