<template>
    <div>
        <a class="skip-link" href="#main">{{ t('shell.skip') }}</a>
        <div class="app">
            <AppHeader />
            <main id="main" tabindex="-1">
                <slot />
            </main>
        </div>
        <TabBar v-if="!isChild" />
        <ProfileMenu />
        <ProfileSwitcher />
    </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const { isChild } = useCurrentMember()
</script>
