<template>
    <header class="row header">
        <NuxtLink :to="homePath" class="row header__brand">
            <AppMaki :size="40" />
            <span class="header__name">Tantara</span>
        </NuxtLink>
        <div class="row">
            <FeedbackButton />
            <button class="header__me" type="button" aria-label="Changer de profil" @click="openSwitcher">
                <AppAvatar :member="current" :size="44" />
            </button>
        </div>
    </header>
</template>

<script setup lang="ts">
const { current, homePath } = useCurrentMember()
const isSwitcherOpen = useState<boolean>('switcher-open', () => false)

const openSwitcher = (): void => {
    isSwitcherOpen.value = true
}
</script>

<style scoped>
.header {
    justify-content: space-between;
}

.header__brand {
    color: inherit;
    text-decoration: none;
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
