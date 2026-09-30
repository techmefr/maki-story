<template>
    <nav class="tabbar">
        <div class="tabbar__inner">
            <NuxtLink
                v-for="tab in tabs"
                :key="tab.path"
                :to="tab.path"
                class="tabbar__item"
                :class="{ 'tabbar__item--on': tab.isOn }"
            >
                {{ tab.label }}
                <span v-if="tab.hasBadge" class="pop" />
            </NuxtLink>
        </div>
    </nav>
</template>

<script setup lang="ts">
const { tabs } = useNavTabs()
</script>
