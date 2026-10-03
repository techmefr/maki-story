<template>
    <section class="stack forgot" data-testid="forgot">
        <AppIconButton icon="back" :label="t('forgot.backToCode')" size="lg" class="forgot__back" @click="emit('back')" />
        <form v-if="!isSent" class="stack forgot__form" @submit.prevent="submit">
            <h1 class="forgot__title" tabindex="-1">{{ t('forgot.title') }}</h1>
            <p class="forgot__intro">{{ t('forgot.intro') }}</p>
            <AppInput
                v-model="email"
                type="email"
                inputmode="email"
                autocomplete="email"
                autocapitalize="off"
                autocorrect="off"
                spellcheck="false"
                required
                :placeholder="t('forgot.email')"
                :aria-label="t('forgot.email')"
                data-testid="forgot-email"
            />
            <p v-if="hasFailed" class="error" role="alert">{{ t('forgot.failed') }}</p>
            <AppButton is-block type="submit" icon="send" :disabled="!isValid || isBusy" data-testid="forgot-send">
                {{ isBusy ? t('forgot.sending') : t('forgot.send') }}
            </AppButton>
            <p class="forgot__child">{{ t('forgot.child') }}</p>
        </form>
        <div v-else class="stack center forgot__done" role="status" data-testid="forgot-sent">
            <span class="forgot__badge" aria-hidden="true"><AppIcon name="send" :size="48" :stroke-width="2.2" /></span>
            <h1 class="forgot__title" tabindex="-1">{{ t('forgot.sentTitle') }}</h1>
            <p class="forgot__intro">{{ t('forgot.sentText') }}</p>
            <AppButton icon="back" @click="emit('back')">{{ t('forgot.backToCode') }}</AppButton>
        </div>
    </section>
</template>

<script setup lang="ts">
const EMAIL_PATTERN = /^\S+@\S+\.\S+$/

const emit = defineEmits<{ back: [] }>()

const { t } = useI18n()
const { requestCodeReset } = useAccount()

const email = ref('')
const isBusy = ref(false)
const isSent = ref(false)
const hasFailed = ref(false)

const isValid = computed(() => EMAIL_PATTERN.test(email.value.trim()))

const submit = async (): Promise<void> => {
    if (!isValid.value) {
        return
    }
    isBusy.value = true
    hasFailed.value = false
    const isOk = await requestCodeReset(email.value.trim())
    isBusy.value = false
    hasFailed.value = !isOk
    isSent.value = isOk
}
</script>

<style scoped>
.forgot {
    gap: 18px;
}

.forgot__back {
    align-self: flex-start;
}

.forgot__form {
    gap: 16px;
}

.forgot__title {
    margin: 0;
    font: 700 min(2rem, 10vw) / 1.1 var(--font-title);
}

.forgot__intro {
    margin: 0;
    color: var(--ink-soft);
    font: 500 1.125rem / 1.35 var(--font-body);
    text-wrap: balance;
}

.forgot__child {
    margin: 0;
    padding: 12px 14px;
    border: 3px dashed var(--ink);
    border-radius: 20px;
    background: var(--paper);
    font: 500 1rem / 1.35 var(--font-body);
}

.forgot__done {
    padding: 30px 0;
    gap: 14px;
}

.forgot__badge {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 96px;
    height: 96px;
    border: 3px solid var(--ink);
    border-radius: 50%;
    background: var(--mint-soft);
    box-shadow: var(--shadow-lg);
    color: var(--on-accent);
}
</style>
