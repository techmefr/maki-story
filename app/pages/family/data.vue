<template>
    <div class="stack narrow">
        <NuxtLink to="/family" class="link-back"><AppIcon name="back" :size="18" class="mirror-rtl" />{{ t('common.back') }}</NuxtLink>
        <h1 class="title">{{ t('recovery.data.title') }}</h1>
        <p class="muted">{{ t('recovery.data.intro') }}</p>
        <section class="card stack" aria-labelledby="export-title">
            <h2 id="export-title" class="subtitle">{{ t('recovery.data.export.title') }}</h2>
            <p class="muted">{{ t('recovery.data.export.hint') }}</p>
            <a :href="`${apiBase}/api/family/export`" class="btn btn--block" download data-testid="family-export">
                <AppIcon name="download" :size="22" />{{ t('recovery.data.export.button') }}
            </a>
        </section>
        <section class="card stack" aria-labelledby="delete-title">
            <h2 id="delete-title" class="subtitle">{{ t('recovery.data.delete.title') }}</h2>
            <p class="error">{{ t('recovery.data.delete.warning') }}</p>
            <template v-if="!isArmed">
                <button type="button" class="btn btn--coral btn--block" data-testid="family-delete-start" @click="isArmed = true">
                    <AppIcon name="trash" :size="22" />{{ t('recovery.data.delete.start') }}
                </button>
            </template>
            <template v-else>
                <label class="stack" style="gap: 6px">
                    <span class="label">{{ t('recovery.data.delete.nameLabel') }}</span>
                    <input v-model="confirmName" class="input" type="text" autocomplete="off" data-testid="family-delete-name" />
                </label>
                <p class="label">{{ t('recovery.data.delete.codeLabel') }}</p>
                <PinPad :key="attempt" :is-disabled="isBusy || confirmName.trim() === ''" @submit="removeFamily" />
                <button type="button" class="btn btn--white btn--small" @click="isArmed = false">{{ t('common.cancel') }}</button>
            </template>
            <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
        </section>
    </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const config = useRuntimeConfig()
const { request } = useApi()

const apiBase = config.public.apiBase
const isArmed = ref(false)
const isBusy = ref(false)
const confirmName = ref('')
const errorMessage = ref('')
const attempt = ref(0)

const removeFamily = async (code: string): Promise<void> => {
    isBusy.value = true
    errorMessage.value = ''
    try {
        await request('/family', { method: 'DELETE', body: { code, confirmName: confirmName.value } })
        await navigateTo('/login', { external: true })
    } catch (error) {
        const status = (error as { statusCode?: number }).statusCode
        errorMessage.value = status === 403 ? t('recovery.data.delete.wrongCode') : status === 400 ? t('recovery.data.delete.wrongName') : t('recovery.data.delete.failed')
        attempt.value += 1
    } finally {
        isBusy.value = false
    }
}
</script>
