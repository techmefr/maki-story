<template>
    <header class="row header">
        <NuxtLink :to="homePath" class="row header__brand">
            <AppLogo :size="40" />
            <span class="header__name">{{ APP_NAME }}</span>
        </NuxtLink>
        <nav v-if="tabs.length > 1" class="nav" :aria-label="t('shell.mainNav')">
            <NuxtLink v-for="tab in tabs" :key="tab.path" :to="tab.path" class="nav__item" :class="{ 'nav__item--on': tab.isOn }">
                <AppIcon :name="tab.icon" :size="18" motion="bounce" :is-active="tab.isOn" />
                {{ tab.label }}
                <span v-if="tab.hasBadge" class="pop" role="img" :aria-label="t('shell.newBadge')" />
            </NuxtLink>
        </nav>
        <div v-else class="grow" />
        <div class="row header__actions">
            <NotificationBell />
            <button class="header__gear" type="button" :aria-label="t('shell.settings.open')" data-testid="settings-open" @click="openSettings">
                <AppIcon name="settings" :size="26" motion="spin" />
            </button>
            <button class="header__me" type="button" :aria-label="t('shell.profile.open')" data-testid="profile-open" @click="openProfile">
                <AppAvatar :member="current" :size="isChild ? 66 : 48" />
            </button>
        </div>
    </header>
</template>

<script setup lang="ts">
const { current, homePath, isChild } = useCurrentMember()
const { tabs } = useNavTabs()
const { t } = useI18n()
const isSettingsOpen = useState<boolean>('profile-menu-open', () => false)
const isProfileOpen = useState<boolean>('profile-card-open', () => false)

const openSettings = (): void => {
    isSettingsOpen.value = true
}

const openProfile = (): void => {
    isProfileOpen.value = true
}
</script>

<style scoped>
.header {
    justify-content: space-between;
    flex-wrap: wrap;
}

@media (max-width: 719px) {
    .header :deep(.nav) {
        display: none;
    }
}

.header__brand {
    min-height: var(--tap);
    color: inherit;
    text-decoration: none;
}

.header :deep(.nav__item) {
    display: inline-flex;
    align-items: center;
    gap: 8px;
}

.header__name {
    font: 700 min(1.625rem, 8vw)/1 var(--font-title);
}

.header__actions {
    gap: 8px;
    flex-wrap: nowrap;
}

.header__gear {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--tap);
    height: var(--tap);
    border: 2.5px solid var(--ink);
    border-radius: 50%;
    background: var(--paper);
    color: var(--ink);
    box-shadow: var(--shadow);
    cursor: pointer;
    transition: transform 0.12s;
}

.header__gear:hover {
    transform: rotate(20deg);
}

.header__me {
    background: none;
    border: 0;
    border-radius: 50%;
    padding: 0;
    cursor: pointer;
    transition: transform 0.12s;
}

.header__me:hover {
    transform: scale(1.06) rotate(-3deg);
}
</style>
