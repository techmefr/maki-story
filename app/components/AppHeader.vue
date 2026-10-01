<template>
    <header class="row header">
        <NuxtLink :to="homePath" class="row header__brand">
            <AppMaki :size="40" />
            <span class="header__name">Tantara</span>
        </NuxtLink>
        <nav v-if="!isChild" class="nav">
            <NuxtLink v-for="tab in tabs" :key="tab.path" :to="tab.path" class="nav__item" :class="{ 'nav__item--on': tab.isOn }">
                <AppIcon :name="tab.icon" :size="18" motion="bounce" :is-active="tab.isOn" />
                {{ tab.label }}
                <span v-if="tab.hasBadge" class="pop" />
            </NuxtLink>
        </nav>
        <div v-else class="grow" />
        <div class="row">
            <FeedbackButton />
            <button class="header__me" type="button" aria-label="Mon profil" @click="openMenu">
                <AppAvatar :member="current" :size="44" />
            </button>
        </div>
    </header>
</template>

<script setup lang="ts">
const { current, homePath, isChild } = useCurrentMember()
const { tabs } = useNavTabs()
const isMenuOpen = useState<boolean>('profile-menu-open', () => false)

const openMenu = (): void => {
    isMenuOpen.value = true
}
</script>

<style scoped>
.header {
    justify-content: space-between;
}

@media (max-width: 719px) {
    .header :deep(.nav) {
        display: none;
    }
}

.header__brand {
    color: inherit;
    text-decoration: none;
}

.header :deep(.nav__item) {
    display: inline-flex;
    align-items: center;
    gap: 8px;
}

.header__name {
    font: 700 26px/1 var(--font-title);
}

.header__me {
    background: none;
    border: 0;
    padding: 0;
    cursor: pointer;
}
</style>
