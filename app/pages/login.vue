<template>
    <div class="stack center narrow login">
        <AppLogo :size="104" class="anim-float" />
        <h1 class="title">Tantara</h1>
        <p class="muted">{{ t('auth.login.tagline') }}</p>
        <section v-if="isSent" class="stack center" role="status">
            <h2 class="subtitle">{{ t('auth.login.sentTitle') }}</h2>
            <p class="muted">{{ t('auth.login.sentText', { email }) }}</p>
            <AppButton variant="secondary" icon="chevron-left" @click="isSent = false">{{ t('auth.login.changeEmail') }}</AppButton>
        </section>
        <form v-else class="stack login__form" @submit.prevent="submit">
            <AppTabs v-model="method" :items="methods" :label="t('auth.login.tabs')" />
            <AppInput
                v-model="email"
                type="email"
                inputmode="email"
                autocomplete="username"
                autocapitalize="off"
                autocorrect="off"
                spellcheck="false"
                required
                :aria-label="t('auth.login.email')"
                :placeholder="t('auth.login.emailPlaceholder')"
            />
            <template v-if="method === 'password'">
                <AppInput
                    v-model="password"
                    type="password"
                    autocomplete="current-password"
                    autocapitalize="off"
                    autocorrect="off"
                    spellcheck="false"
                    required
                    :aria-label="t('auth.login.password')"
                    :placeholder="t('auth.login.passwordPlaceholder')"
                />
                <button class="login__forgot" type="button" @click="method = 'magic'">{{ t('auth.login.forgot') }}</button>
            </template>
            <div v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</div>
            <AppButton is-block type="submit" :icon="method === 'magic' ? 'send' : 'unlock'" :disabled="isBusy">
                {{ submitLabel }}
            </AppButton>
            <div class="login__or" aria-hidden="true"><span />{{ t('auth.login.or') }}<span /></div>
            <SocialSignIn />
            <AppButton variant="secondary" is-block icon="rocket" to="/register">{{ t('auth.login.createFamily') }}</AppButton>
        </form>
    </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'blank' })

const { login, requestMagicLink } = useSession()
const { t, locale } = useI18n()
const route = useRoute()

const method = ref<'magic' | 'password'>('magic')
const email = ref('')
const password = ref('')
const isBusy = ref(false)
const isSent = ref(false)

const methods = computed(() => [
    { id: 'magic', label: t('auth.login.magicTab') },
    { id: 'password', label: t('auth.login.passwordTab') },
])
const submitLabel = computed(() => {
    if (isBusy.value) {
        return t('auth.login.submitting')
    }
    return method.value === 'magic' ? t('auth.login.sendLink') : t('auth.login.submit')
})

const SOCIAL_ERRORS: Record<string, string> = {
    email_unverified: 'auth.login.emailUnverified',
    oauth_state: 'auth.login.oauthState',
    oauth_denied: 'auth.login.oauthDenied',
    oauth_failed: 'auth.login.oauthFailed',
}
const socialKey = SOCIAL_ERRORS[String(route.query.error ?? '')]
const errorMessage = ref(socialKey ? t(socialKey) : '')

const failureMessage = (result: TAuthResult): string => {
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
    const address = email.value.trim()
    if (method.value === 'magic') {
        const sent = await requestMagicLink(address, locale.value)
        isBusy.value = false
        if (sent.status !== 'ok') {
            errorMessage.value = failureMessage(sent)
            return
        }
        isSent.value = true
        return
    }
    const result = await login(address, password.value)
    isBusy.value = false
    if (result.status !== 'ok') {
        errorMessage.value = failureMessage(result)
        return
    }
    await navigateTo('/profiles')
}
</script>

<style scoped>
.login {
    margin-top: 4vh;
}

.login__form {
    width: 100%;
    text-align: start;
}

.login__forgot {
    align-self: flex-end;
    padding-inline-end: 8px;
    font: 700 0.9375rem/1.2 var(--font-title);
    min-height: var(--tap);
    color: var(--ink);
    text-decoration: underline;
    cursor: pointer;
}

.login__or {
    display: flex;
    align-items: center;
    gap: 12px;
    font: 700 1rem/1 var(--font-title);
}

.login__or span {
    flex: 1;
    height: 3px;
    background: var(--ink);
}
</style>
