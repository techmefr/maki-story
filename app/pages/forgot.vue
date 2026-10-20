<template>
    <AuthShell :tagline="t('auth.login.tagline')">
        <ForgotCodeForm @back="goBack" />
    </AuthShell>
</template>

<script setup lang="ts">
import AuthShell from '../components/AuthShell.vue'
const { t } = useI18n()
definePageMeta({ layout: 'blank' })

const router = useRouter()

const goBack = async (): Promise<void> => {
    if (window.history.length > 1) {
        router.back()
        return
    }
    await navigateTo('/profiles')
}
</script>
