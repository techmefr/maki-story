<template>
    <AuthShell :tagline="t('auth.login.tagline')">
        <JoinFlow />
    </AuthShell>
</template>

<script setup lang="ts">
import AuthShell from '../../components/AuthShell.vue'
const { t } = useI18n()
definePageMeta({ layout: 'blank' })
</script>
