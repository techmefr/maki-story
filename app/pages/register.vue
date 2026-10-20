<template>
    <AuthShell :title="t('auth.register.title')" :tagline="t('auth.register.tagline')">
        <form class="stack register__form" @submit.prevent="submit">
            <label class="stack register__field">
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
            <label class="stack register__field">
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
            <label class="stack register__field">
                <span class="label">{{ t('auth.register.familyName') }}</span>
                <input v-model="familyName" class="input" type="text" :placeholder="t('auth.register.familyPlaceholder')" required />
            </label>
            <label class="stack register__field">
                <span class="label">{{ t('auth.register.parentName') }}</span>
                <input v-model="parentName" class="input" type="text" :placeholder="t('auth.register.parentPlaceholder')" required />
            </label>
            <div v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</div>
            <AppButton is-block type="submit" :disabled="isBusy">
                {{ isBusy ? t('auth.register.submitting') : t('auth.register.submit') }}
            </AppButton>
        </form>
        <AppButton variant="secondary" is-block to="/login">{{ t('auth.register.haveAccount') }}</AppButton>
    </AuthShell>
</template>

<script setup lang="ts">
import AuthShell from '../components/AuthShell.vue'
definePageMeta({ layout: 'blank' })

const { register } = useSession()
const { t, locale } = useI18n()

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
        locale: locale.value,
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
    await navigateTo('/welcome')
}
</script>

<style scoped>
.register__form { width: 100%; gap: 20px; text-align: start; margin-bottom: 24px; }
.register__field { gap: 8px; min-width: 0; }
</style>
