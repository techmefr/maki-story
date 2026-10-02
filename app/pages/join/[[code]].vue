<template>
    <div class="stack narrow join">
        <div class="row" style="justify-content: center">
            <AppLogo :size="64" />
        </div>
        <template v-if="phase === 'code'">
            <h1 class="title">{{ t('join.title') }}</h1>
            <p class="muted">{{ t('join.codeHint') }}</p>
            <form class="stack" @submit.prevent="check">
                <label class="stack" style="gap: 6px">
                    <span class="label">{{ t('join.codeLabel') }}</span>
                    <input v-model="code" class="input" type="text" autocomplete="off" autocapitalize="off" maxlength="20" required data-testid="join-code" />
                </label>
                <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
                <AppButton is-block class="join__action" type="submit" :disabled="isBusy || code.trim() === ''" data-testid="join-check">
                    <AppIcon name="check" :size="22" />{{ t('join.check') }}
                </AppButton>
            </form>
        </template>
        <template v-else-if="phase === 'invalid'">
            <AppEmpty :title="t('join.invalidTitle')" :hint="t('join.invalidHint')" />
            <AppButton variant="secondary" is-block class="join__action" @click="phase = 'code'">
                <AppIcon name="back" :size="22" class="mirror-rtl" />{{ t('join.tryAgain') }}
            </AppButton>
        </template>
        <template v-else>
            <h1 class="title" data-testid="join-family">{{ t('join.welcome', { family: preview.familyName }) }}</h1>
            <p v-if="preview.inviterName" class="muted">{{ t('join.invitedBy', { name: preview.inviterName }) }}</p>
            <AppButton is-block class="join__action" v-if="isSignedIn" :disabled="isBusy" data-testid="join-one-tap" @click="join">
                <AppIcon name="user-plus" :size="22" motion="bounce" />{{ t('join.oneTap', { family: preview.familyName }) }}
            </AppButton>
            <form v-else class="stack" @submit.prevent="join">
                <p class="muted">{{ t('join.accountHint') }}</p>
                <label class="stack" style="gap: 6px">
                    <span class="label">{{ t('join.nameLabel') }}</span>
                    <input v-model="name" class="input" type="text" maxlength="60" autocomplete="given-name" data-testid="join-name" />
                </label>
                <label class="stack" style="gap: 6px">
                    <span class="label">{{ t('join.emailLabel') }}</span>
                    <input v-model="email" class="input" type="email" autocomplete="email" required data-testid="join-email" />
                </label>
                <label class="stack" style="gap: 6px">
                    <span class="label">{{ t('join.passwordLabel') }}</span>
                    <input v-model="password" class="input" type="password" autocomplete="current-password" minlength="8" required data-testid="join-password" />
                </label>
                <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
                <AppButton is-block class="join__action" type="submit" :disabled="isBusy" data-testid="join-submit">
                    <AppIcon name="user-plus" :size="22" motion="bounce" />{{ t('join.submit') }}
                </AppButton>
            </form>
            <p v-if="isSignedIn && errorMessage" class="error" role="alert">{{ errorMessage }}</p>
        </template>
    </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'blank' })

const { t } = useI18n()
const route = useRoute()
const { preview: loadPreview } = useInvitations()
const { check: checkSession, redeemInvitation } = useSession()

const code = ref(String(route.params.code ?? ''))
const phase = ref<'code' | 'invalid' | 'ready'>('code')
const preview = ref<IInvitationPreview>({ familyName: '', inviterName: '', isUsable: false })
const isSignedIn = ref(false)
const isBusy = ref(false)
const name = ref('')
const email = ref('')
const password = ref('')
const errorMessage = ref('')

const check = async (): Promise<void> => {
    isBusy.value = true
    errorMessage.value = ''
    try {
        preview.value = await loadPreview(code.value.trim())
        phase.value = preview.value.isUsable ? 'ready' : 'invalid'
    } catch (error) {
        console.error('L invitation n a pas pu être vérifiée', error)
        errorMessage.value = (error as { statusCode?: number }).statusCode === 429 ? t('join.tooMany') : t('join.failed')
    } finally {
        isBusy.value = false
    }
}

const join = async (): Promise<void> => {
    isBusy.value = true
    errorMessage.value = ''
    const result = await redeemInvitation({ code: code.value.trim(), name: name.value, email: email.value.trim(), password: password.value })
    isBusy.value = false
    if (result.status === 'ok') {
        await navigateTo('/relative')
        return
    }
    errorMessage.value = result.status === 'invalid' ? t('join.invalidCredentials') : t('join.failed')
}

onMounted(async () => {
    isSignedIn.value = await checkSession()
    if (code.value !== '') {
        await check()
    }
})
</script>

<style scoped>
.join__action {
    min-height: 56px;
}
</style>
