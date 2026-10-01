<template>
    <div>
        <a class="skip-link" href="#main">Aller au contenu</a>
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
const { isChild } = useCurrentMember()
</script>
