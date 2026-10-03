<template>
    <form class="pwd stack" aria-labelledby="pwd-title" @submit.prevent="change">
        <h2 id="pwd-title" class="pwd__title">{{ t('profile.menu.passwordTitle') }}</h2>
        <label class="stack pwd__field">
            <span class="pwd__label">{{ t('profile.menu.currentPassword') }}</span>
            <AppInput v-model="currentPassword" type="password" autocomplete="current-password" required />
        </label>
        <label class="stack pwd__field">
            <span class="pwd__label">{{ t('profile.menu.newPassword') }}</span>
            <AppInput v-model="newPassword" type="password" autocomplete="new-password" :minlength="PASSWORD_MIN_LENGTH" required />
        </label>
        <label class="stack pwd__field">
            <span class="pwd__label">{{ t('profile.menu.confirmPassword') }}</span>
            <AppInput v-model="confirmPassword" type="password" autocomplete="new-password" required />
        </label>
        <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
        <p v-if="isDone" class="pwd__done" role="status">{{ t('profile.menu.passwordDone') }}</p>
        <AppButton variant="secondary" icon="lock" is-block type="submit" :disabled="isBusy">{{ t('profile.menu.changePassword') }}</AppButton>
    </form>
</template>

<script setup lang="ts">
const PASSWORD_MIN_LENGTH = 8

const { t } = useI18n()
const { request } = useApi()

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const errorMessage = ref('')
const isDone = ref(false)
const isBusy = ref(false)

const failureMessage = (status: number | undefined): string => {
    if (status === 403) {
        return t('profile.menu.passwordWrong')
    }
    return status === 429 ? t('profile.menu.passwordThrottled') : t('profile.menu.passwordFailed')
}

const change = async (): Promise<void> => {
    errorMessage.value = ''
    isDone.value = false
    if (newPassword.value.length < PASSWORD_MIN_LENGTH) {
        errorMessage.value = t('profile.menu.passwordTooShort', { min: PASSWORD_MIN_LENGTH })
        return
    }
    if (newPassword.value !== confirmPassword.value) {
        errorMessage.value = t('profile.menu.passwordMismatch')
        return
    }
    if (newPassword.value === currentPassword.value) {
        errorMessage.value = t('profile.menu.passwordSame')
        return
    }
    isBusy.value = true
    try {
        await request('/auth/password', { method: 'PUT', body: { currentPassword: currentPassword.value, newPassword: newPassword.value } })
        currentPassword.value = ''
        newPassword.value = ''
        confirmPassword.value = ''
        isDone.value = true
    } catch (error) {
        errorMessage.value = failureMessage((error as { statusCode?: number }).statusCode)
    } finally {
        isBusy.value = false
    }
}
</script>

<style scoped>
.pwd {
    padding: 16px;
    border: var(--outline) solid var(--ink);
    border-radius: 22px;
    background: var(--paper);
    box-shadow: var(--shadow);
}

.pwd__title {
    margin: 0;
    font: 700 1.1875rem/1.2 var(--font-title);
}

.pwd__field {
    gap: 6px;
}

.pwd :deep(.input) {
    min-height: 54px;
    padding: 0 22px;
    border-width: var(--outline);
    border-radius: 999px;
    font-size: 1.125rem;
}

.pwd__label {
    font: 700 1rem/1.2 var(--font-title);
}

.pwd__done {
    margin: 0;
    color: var(--ink-soft);
    font: 700 0.9375rem/1.3 var(--font-body);
}
</style>
