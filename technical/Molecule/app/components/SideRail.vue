<template>
    <nav v-if="tabs.length > 1" class="rail" :aria-label="t('shell.mainNav')">
        <NuxtLink
            v-for="tab in tabs"
            :key="tab.path"
            :to="tab.path"
            class="rail__item"
            :data-testid="`nav-tab-${tab.path.slice(1)}`"
            :class="{ 'rail__item--on': tab.isOn }"
            :aria-current="tab.isOn ? 'page' : undefined"
        >
            <AppIcon :name="tab.icon" :size="28" motion="bounce" :is-active="tab.isOn" />
            <span class="rail__label">{{ tab.label }}</span>
            <span v-if="tab.hasBadge" class="pop" role="img" :aria-label="t('shell.newBadge')" />
        </NuxtLink>
    </nav>
</template>

<script setup lang="ts">
const { t } = useI18n()
const { tabs } = useNavTabs()
</script>

<style scoped>
.rail {
    display: none;
}

@media (min-width: 1024px) {
    .rail {
        position: fixed;
        inset-block: 0;
        inset-inline-start: 0;
        z-index: 20;
        display: flex;
        flex-direction: column;
        align-items: stretch;
        gap: 10px;
        width: 104px;
        padding: calc(env(safe-area-inset-top) + 96px) 8px 24px;
        border-inline-end: var(--outline) solid var(--ink);
        background: var(--bg);
    }
}

.rail__item {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    min-height: 72px;
    padding: 10px 4px;
    border: 2.5px solid transparent;
    border-radius: 18px;
    color: var(--ink);
    text-decoration: none;
}

.rail__item--on {
    border-color: var(--ink);
    background: var(--yellow);
    box-shadow: var(--shadow);
    color: var(--on-accent);
}

.rail__label {
    font: 700 0.75rem/1.1 var(--font-title);
    text-align: center;
    overflow-wrap: normal;
    hyphens: auto;
}
</style>
