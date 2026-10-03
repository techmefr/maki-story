
<template>
    <section class="stack social" :aria-label="t('auth.social.ariaLabel')">
        <AppButton v-for="provider in visibleProviders" :key="provider" as="a" variant="secondary" is-block :href="startUrl(provider)">
            {{ t('auth.social.continueWith', { provider: PROVIDER_LABELS[provider] ?? provider }) }}
        </AppButton>
        <AppButton variant="secondary" is-block
            :aria-expanded="isOtherOpen"
            aria-controls="other-accounts"
            @click="isOtherOpen = !isOtherOpen">
            {{ t('auth.social.other') }}
        </AppButton>
        <ul v-if="isOtherOpen" id="other-accounts" class="stack social__list">
            <li v-for="name in upcoming" :key="name">
                <AppButton variant="secondary" is-block class="social__disabled" disabled aria-disabled="true">
                    {{ t('auth.social.soon', { provider: PROVIDER_LABELS[name] ?? name }) }}
                </AppButton>
            </li>
        </ul>
    </section>
</template>

<script setup lang="ts">
const PROVIDER_LABELS: Record<string, string> = {
    google: 'Google',
    apple: 'Apple',
    microsoft: 'Microsoft',
    facebook: 'Facebook',
}

const { t } = useI18n()
const config = useRuntimeConfig()
const { request } = useApi()

const providers = ref<OAuthProviderId[]>([])
const upcoming = ref<string[]>([])
const isOtherOpen = ref(false)
const isAppleContext = ref(false)

const visibleProviders = computed(() => providers.value.filter(provider => provider !== 'apple' || isAppleContext.value))

const startUrl = (provider: string): string => `${config.public.apiBase}/api/auth/oauth/${provider}/start`

onMounted(async () => {
    isAppleContext.value = detectAppleContext()
    try {
        const result = await request<IOAuthProviders>('/auth/oauth/providers')
        providers.value = result.providers
        upcoming.value = result.upcoming
    } catch (_error) {
        providers.value = []
    }
})
</script>

<style scoped>
.social__list {
    list-style: none;
    margin: 0;
    padding: 0;
}

.social__disabled {
    opacity: 0.55;
    cursor: not-allowed;
    box-shadow: none;
}
</style>
