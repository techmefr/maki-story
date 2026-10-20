<template>
    <div ref="shell" class="kid shell kid-world">
        <ChildFoliage />
        <a class="skip-link" href="#main">{{ t('shell.skip') }}</a>
        <SideRail />
        <div class="app">
            <AppHeader />
            <NightCountdown />
            <main id="main" tabindex="-1">
                <slot />
            </main>
        </div>
        <TabBar />
        <OutboxStatus />
        <ProfileMenu />
        <ProfileCard />
        <FeedbackSheet />
        <ProfileSwitcher />
    </div>
</template>

<script setup lang="ts">
import ChildFoliage from '~~/technical/Motion/app/components/ChildFoliage.vue'
const { t } = useI18n()
const shell = ref<HTMLElement | null>(null)
let layoutObserver: ResizeObserver | null = null

onMounted(() => {
    const app = shell.value?.querySelector<HTMLElement>('.app')
    const header = shell.value?.querySelector<HTMLElement>('.header')
    const navigation = shell.value?.querySelector<HTMLElement>('.tabbar')
    layoutObserver = new ResizeObserver(() => {
        if (navigation) {
            shell.value?.style.setProperty('--child-nav-height', `${navigation.getBoundingClientRect().height}px`)
        }
        if (app && header) {
            const clearance = Math.ceil(parseFloat(getComputedStyle(app).paddingTop) + header.getBoundingClientRect().height + 16)
            shell.value?.style.setProperty('--child-header-clearance', `${clearance}px`)
        }
    })
    for (const element of [app, header, navigation]) {
        if (element) {
            layoutObserver.observe(element)
        }
    }
})

onBeforeUnmount(() => layoutObserver?.disconnect())
</script>

<style scoped>
.kid :deep(main) {
    min-width: 0;
}

.kid :deep(.title) {
    font-size: clamp(1.75rem, 5vw, 2.125rem);
}

.kid :deep(.btn) {
    border-radius: 28px;
}

.kid :deep(.tabbar__item) {
    min-height: 72px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-size: 1rem;
}

.kid :deep(.tabbar__item .icon) {
    flex: none;
}

@media (min-width: 1024px) {
    .kid :deep(.app) {
        padding: 28px 32px 64px;
        gap: 28px;
    }
}
</style>
