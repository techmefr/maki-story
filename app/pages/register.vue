<template>
    <div class="stack center narrow" style="margin-top: 6vh">
        <AppLogo :size="110" class="anim-float" />
        <h1 class="title">{{ t('auth.register.title') }}</h1>
        <p class="muted">{{ t('auth.register.tagline') }}</p>
        <form class="card stack" style="width: 100%; text-align: start" @submit.prevent="submit">
            <label class="stack" style="gap: 6px">
                <span class="label">{{ t('auth.login.email') }}</span>
                <input
                    v-model="email"
                    class="input"
                    type="email"
                    inputmode="email"
                    autocomplete="email"
                    autocapitalize="off"
                    autocorrect="off"
                    spellcheck="false"
                    required
                />
            </label>
            <label class="stack" style="gap: 6px">
                <span class="label">{{ t('auth.register.passwordLabel') }}</span>
                <input
                    v-model="password"
                    class="input"
                    type="password"
                    autocomplete="new-password"
                    autocapitalize="off"
                    autocorrect="off"
                    spellcheck="false"
                    minlength="8"
                    required
                />
            </label>
            <label class="stack" style="gap: 6px">
                <span class="label">{{ t('auth.register.familyName') }}</span>
                <input v-model="familyName" class="input" type="text" :placeholder="t('auth.register.familyPlaceholder')" required />
            </label>
            <label class="stack" style="gap: 6px">
                <span class="label">{{ t('auth.register.parentName') }}</span>
                <input v-model="parentName" class="input" type="text" :placeholder="t('auth.register.parentPlaceholder')" required />
            </label>
            <div v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</div>
            <button type="submit" class="btn btn--block" :disabled="isBusy">
                {{ isBusy ? t('auth.register.submitting') : t('auth.register.submit') }}
            </button>
        </form>
        <NuxtLink to="/login" class="btn btn--white btn--block">{{ t('auth.register.haveAccount') }}</NuxtLink>
    </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'blank' })

const { register } = useSession()
const { t } = useI18n()

const email = ref('')
const password = ref('')
const familyName = ref('')
const parentName = ref('')
const isBusy = ref(false)
const errorMessage = ref('')

const submit = async (): Promise<void> => {
    errorMessage.value = ''
    isBusy.value = true
    const result = await register({
        email: email.value.trim(),
        password: password.value,
        familyName: familyName.value,
        parentName: parentName.value,
    })
    isBusy.value = false
    if (result.status === 'unreachable') {
        errorMessage.value = t('auth.login.unreachable')
        return
    }
    if (result.status !== 'ok') {
        errorMessage.value = t('auth.register.failed')
        return
    }
    await navigateTo('/profiles')
}
</script>
