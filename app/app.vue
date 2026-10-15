<template>
    <div>
        <NuxtRouteAnnouncer />
        <NuxtLayout>
            <NuxtPage />
        </NuxtLayout>
        <SplashScreen />
        <PageCurtain />
        <OfflineBanner />
        <DevFeedbackWidget v-if="isDevFeedback" />
    </div>
</template>

<script setup lang="ts">
const isDevFeedback = useRuntimeConfig().public.appEnv === 'development-local'
const { locale, dir } = useI18n()
const { activeLocale, syncLocale } = useLocale()

useHead({ htmlAttrs: { lang: locale, dir } })

watch(activeLocale, () => void syncLocale())
</script>
