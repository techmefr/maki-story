<template>
    <div class="shell" :class="{ 'shell--adult': !isChild }">
        <a class="skip-link" href="#main">{{ t('shell.skip') }}</a>
        <SideRail />
        <div class="app">
            <AppHeader />
            <main id="main" tabindex="-1">
                <slot />
            </main>
        </div>
        <TabBar v-if="!isChild" />
        <OutboxStatus />
        <ProfileMenu />
        <ProfileCard />
        <FeedbackSheet />
        <ProfileSwitcher />
    </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const { isChild } = useCurrentMember()
useTourRunner()
</script>

<style scoped>
.shell--adult :deep(main) {
    min-width: 0;
}

.shell--adult :deep(.title) {
    font-size: 2rem;
    line-height: 1.15;
}

.shell--adult :deep(.subtitle) {
    font-size: 1.5rem;
}

.shell--adult :deep(.card) {
    border-width: 3px;
    border-radius: 24px;
    padding: 20px;
}

.shell--adult :deep(.btn) {
    border-radius: 24px;
}

.shell--adult :deep(.grid--books) {
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 152px), 1fr));
    gap: 24px 20px;
}

.shell--adult :deep(.book__title) {
    font-size: 1.125rem;
    text-align: start;
}

.shell--adult :deep(.book__status) {
    align-self: flex-start;
    font-size: 0.875rem;
}

@media (min-width: 1024px) {
    .shell--adult {
        padding-inline-start: 224px;
    }

    .shell--adult :deep(.rail) {
        width: 224px;
        padding: 96px 16px 24px;
        gap: 16px;
    }

    .shell--adult :deep(.rail__item) {
        flex-direction: row;
        align-items: center;
        gap: 12px;
        min-height: 56px;
        padding: 12px 16px;
        border-radius: 24px;
    }

    .shell--adult :deep(.rail__label) {
        font-size: 1rem;
        text-align: start;
        overflow-wrap: anywhere;
    }

    .shell--adult :deep(.rail .pop) {
        inset-inline-end: 8px;
    }

    .shell--adult :deep(.app) {
        max-width: 1280px;
        padding: 32px 40px 64px;
        gap: 32px;
    }

    .shell--adult :deep(.grid--books) {
        grid-template-columns: repeat(auto-fill, minmax(176px, 1fr));
    }
}

@media (max-width: 389px) {
    .shell--adult :deep(.card) {
        padding: 16px;
    }

    .shell--adult :deep(.grid--books) {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 20px 12px;
    }
}
</style>
