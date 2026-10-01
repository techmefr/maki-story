<template>
    <div>
        <NuxtRouteAnnouncer />
        <NuxtLayout>
            <NuxtPage />
        </NuxtLayout>
        <PageCurtain />
        <OfflineBanner />
    </div>
</template>

<script setup lang="ts">
const { locale, dir } = useI18n()
const { activeLocale, syncLocale } = useLocale()

useHead({ htmlAttrs: { lang: locale, dir } })

watch(activeLocale, () => void syncLocale())
</script>
