<template>
    <div>
        <NuxtRouteAnnouncer />
        <DemoAccountSwitcher v-if="isDemo" />
        <OfflineBanner />
        <NuxtLayout>
            <NuxtPage />
        </NuxtLayout>
        <SplashScreen />
        <PageCurtain />
        <DevFeedbackWidget v-if="isDevFeedback" />
    </div>
</template>

<script setup lang="ts">
import DemoAccountSwitcher from '../functional/Account/app/components/DemoAccountSwitcher.vue'
const isDemo = import.meta.dev && useRuntimeConfig().public.demoMode === true
const isDevFeedback = useRuntimeConfig().public.appEnv === 'development-local'
const { locale, dir } = useI18n()
const { activeLocale, syncLocale } = useLocale()

useHead({ htmlAttrs: { lang: locale, dir } })

watch(activeLocale, () => void syncLocale())
</script>
