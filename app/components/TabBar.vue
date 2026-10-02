<template>
    <nav v-if="tabs.length > 1" class="tabbar" :aria-label="t('shell.mainNav')">
        <div class="tabbar__inner">
            <NuxtLink
                v-for="tab in tabs"
                :key="tab.path"
                :to="tab.path"
                class="tabbar__item"
                :class="{ 'tabbar__item--on': tab.isOn }"
            >
                <AppIcon :name="tab.icon" :size="26" motion="bounce" :is-active="tab.isOn" />
                <span>{{ tab.label }}</span>
                <span v-if="tab.hasBadge" class="pop" role="img" :aria-label="t('shell.newBadge')" />
            </NuxtLink>
        </div>
    </nav>
</template>

<script setup lang="ts">
const { t } = useI18n()
const { tabs } = useNavTabs()
</script>

<style scoped>
.tabbar__item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
}
</style>
