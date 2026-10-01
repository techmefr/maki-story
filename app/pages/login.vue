<template>
    <div class="stack center narrow" style="margin-top: 6vh">
        <AppLogo :size="110" class="anim-float" />
        <h1 class="title">Tantara</h1>
        <p class="muted">{{ t('auth.login.tagline') }}</p>
        <form class="card stack" style="width: 100%; text-align: start" @submit.prevent="submit">
            <label class="stack" style="gap: 6px">
                <span class="label">{{ t('auth.login.email') }}</span>
                <input
                    v-model="email"
                    class="input"
                    type="email"
                    inputmode="email"
                    autocomplete="username"
                    autocapitalize="off"
                    autocorrect="off"
                    spellcheck="false"
                    required
                />
            </label>
            <label class="stack" style="gap: 6px">
                <span class="label">{{ t('auth.login.password') }}</span>
                <div class="row">
                    <input
                        v-model="password"
                        class="input grow"
                        :type="isVisible ? 'text' : 'password'"
                        autocomplete="current-password"
                        autocapitalize="off"
                        autocorrect="off"
                        spellcheck="false"
                        required
                    />
                    <button type="button" class="btn btn--small btn--white" @click="isVisible = !isVisible">
                        {{ isVisible ? t('auth.login.hide') : t('auth.login.show') }}
                    </button>
                </div>
            </label>
            <div v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</div>
            <button type="submit" class="btn btn--block" :disabled="isBusy">
                {{ isBusy ? t('auth.login.submitting') : t('auth.login.submit') }}
            </button>
        </form>
        <NuxtLink to="/register" class="btn btn--white btn--block">{{ t('auth.login.createFamily') }}</NuxtLink>
        <SocialSignIn />
        <div class="dots" style="justify-content: center" aria-hidden="true">
            <span v-for="color in colors" :key="color.id" class="dot" :style="{ background: color.hex }" />
        </div>
    </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'blank' })

const colors = VOICE_COLORS
const { login } = useSession()
const { t } = useI18n()

const email = ref('')
const password = ref('')
const isVisible = ref(false)
const isBusy = ref(false)
const route = useRoute()
const SOCIAL_ERRORS: Record<string, string> = {
    email_unverified: 'auth.login.emailUnverified',
    oauth_state: 'auth.login.oauthState',
    oauth_denied: 'auth.login.oauthDenied',
    oauth_failed: 'auth.login.oauthFailed',
}
const socialKey = SOCIAL_ERRORS[String(route.query.error ?? '')]
const errorMessage = ref(socialKey ? t(socialKey) : '')

const loginMessage = (result: TAuthResult): string => {
    if (result.status === 'throttled') {
        return t('auth.login.throttled', { count: result.retryAfterMinutes })
    }
    if (result.status === 'unreachable') {
        return t('auth.login.unreachable')
    }
    if (result.status === 'error') {
        return t('auth.login.serverError')
    }
    return t('auth.login.invalid')
}

const submit = async (): Promise<void> => {
    errorMessage.value = ''
    isBusy.value = true
    const result = await login(email.value.trim(), password.value)
    isBusy.value = false
    if (result.status !== 'ok') {
        errorMessage.value = loginMessage(result)
        return
    }
    await navigateTo('/profiles')
}
</script>
