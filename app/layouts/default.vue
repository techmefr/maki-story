<template>
    <div>
        <div class="app">
            <AppHeader />
            <slot />
        </div>
        <TabBar v-if="!isChild" />
        <ProfileSwitcher />
    </div>
</template>

<script setup lang="ts">
const { isChild } = useCurrentMember()
</script>
