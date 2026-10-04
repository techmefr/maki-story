<template>
    <div class="stack center narrow" style="margin-top: 12vh">
        <AppLogo :size="96" class="anim-float" />
        <template v-if="failure === ''">
            <h1 class="subtitle" role="status">{{ t('auth.magic.title') }}</h1>
        </template>
        <template v-else>
            <p class="error" role="alert">{{ failure }}</p>
            <AppButton icon="send" to="/login">{{ t('auth.magic.retry') }}</AppButton>
        </template>
    </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'blank' })

const { verifyMagicLink } = useSession()
const { landingPath } = useFamilies()
const { t } = useI18n()
const route = useRoute()

const failure = ref('')

onMounted(async () => {
    const token = String(route.query.token ?? '')
    const result = await verifyMagicLink(token)
    if (result.status === 'ok') {
        await navigateTo(await landingPath())
        return
    }
    failure.value = t('auth.magic.expired')
})
</script>
