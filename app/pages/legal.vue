<template>
    <LegalDocument
        :can-accept="needsAcceptance"
        :is-busy="isBusy"
        :error-message="errorMessage"
        :accepted-on="acceptedOn"
        @accept="accept"
        @back="goBack"
    />
</template>

<script setup lang="ts">
definePageMeta({ layout: 'blank' })

const route = useRoute()
const router = useRouter()
const { info, load, acceptTerms } = useAccount()
const { check } = useSession()
const { t } = useI18n()

const nextPath = computed(() => (route.query.next === undefined ? null : safeNextPath(route.query.next, '/profiles')))
const isSignedIn = ref(false)
const isBusy = ref(false)
const errorMessage = ref('')

const isAccepted = computed(() => info.value?.termsVersion === TERMS_VERSION)
const needsAcceptance = computed(() => nextPath.value !== null && !isAccepted.value)
const acceptedOn = computed(() => (isAccepted.value && info.value?.termsAcceptedAt ? new Date(info.value.termsAcceptedAt).toLocaleDateString() : ''))

const accept = async (): Promise<void> => {
    isBusy.value = true
    errorMessage.value = ''
    const isSaved = !isSignedIn.value || (await acceptTerms())
    isBusy.value = false
    if (!isSaved) {
        errorMessage.value = t('legal.failed')
        return
    }
    await navigateTo(nextPath.value ?? '/profiles')
}

const goBack = async (): Promise<void> => {
    if (window.history.length > 1) {
        router.back()
        return
    }
    await navigateTo(isSignedIn.value ? '/profiles' : '/login')
}

onMounted(async () => {
    isSignedIn.value = await check()
    if (isSignedIn.value) {
        await load()
    }
})
</script>
