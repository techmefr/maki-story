<template>
    <div class="stack join">
        <ol v-if="phase !== 'invalid'" class="join__segments" :aria-label="t('join.progress', { current: stepIndex + 1, total: STEPS.length })">
            <li v-for="item in STEPS" :key="item" class="join__segment" :class="{ 'join__segment--on': STEPS.indexOf(item) <= stepIndex }" />
        </ol>

        <section v-if="phase === 'code'" class="stack">
            <h1 class="title" tabindex="-1">{{ t('join.title') }}</h1>
            <p class="join__hint">{{ t('join.codeHint') }}</p>
            <form class="stack" @submit.prevent="check">
                <AppInput
                    v-model="code"
                    class="join__code"
                    type="text"
                    autocomplete="off"
                    autocapitalize="off"
                    maxlength="20"
                    required
                    :aria-label="t('join.codeLabel')"
                    :placeholder="t('join.codePlaceholder')"
                    data-testid="join-code"
                />
                <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
                <AppButton is-block class="join__action" type="submit" icon="check" :disabled="isBusy || code.trim() === ''" data-testid="join-check">
                    {{ t('join.check') }}
                </AppButton>
            </form>
        </section>

        <section v-else-if="phase === 'invalid'" class="stack">
            <AppEmpty :title="t('join.invalidTitle')" :hint="t('join.invalidHint')" />
            <AppButton variant="secondary" is-block class="join__action" icon="back" @click="phase = 'code'">{{ t('join.tryAgain') }}</AppButton>
        </section>

        <section v-else-if="phase === 'profile'" class="stack">
            <p class="join__banner" data-testid="join-family">{{ t(`join.banner.${preview.role}`, { family: preview.familyName }) }}</p>
            <p v-if="preview.inviterName" class="join__hint">{{ t('join.invitedBy', { name: preview.inviterName }) }}</p>
            <AppButton v-if="isSignedIn" is-block class="join__action" icon="user-plus" :disabled="isBusy" data-testid="join-one-tap" @click="submit">
                {{ t('join.oneTap', { family: preview.familyName }) }}
            </AppButton>
            <form v-else class="stack" @submit.prevent="phase = 'secret'">
                <h1 class="title" tabindex="-1">{{ t('join.profileTitle') }}</h1>
                <p class="join__hint">{{ t('join.accountHint') }}</p>
                <AppInput v-model="name" type="text" maxlength="60" autocomplete="given-name" :aria-label="t('join.nameLabel')" :placeholder="t('join.namePlaceholder')" data-testid="join-name" />
                <AppInput v-model="email" type="email" autocomplete="email" required :aria-label="t('join.emailLabel')" :placeholder="t('join.emailLabel')" data-testid="join-email" />
                <AppInput
                    v-model="password"
                    type="password"
                    autocomplete="current-password"
                    minlength="8"
                    required
                    :aria-label="t('join.passwordLabel')"
                    :placeholder="t('join.passwordLabel')"
                    data-testid="join-password"
                />
                <AppButton is-block class="join__action" type="submit" icon="next" :disabled="!canContinue" data-testid="join-next">{{ t('join.next') }}</AppButton>
            </form>
            <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
        </section>

        <section v-else class="stack">
            <h1 class="title" tabindex="-1">{{ t('join.secretTitle') }}</h1>
            <CodeField v-model="secret" role="parent" :label="t('join.secretHint')" />
            <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
            <AppButton is-block class="join__action" icon="user-plus" :disabled="isBusy || secret === null" data-testid="join-submit" @click="submit">
                {{ t('join.submit') }}
            </AppButton>
        </section>
    </div>
</template>

<script setup lang="ts">
type TJoinPhase = 'code' | 'invalid' | 'profile' | 'secret'

const STEPS: TJoinPhase[] = ['code', 'profile', 'secret']
const MIN_PASSWORD_LENGTH = 8

const { t } = useI18n()
const route = useRoute()
const { preview: loadPreview } = useInvitations()
const { check: checkSession, redeemInvitation } = useSession()

const code = ref(String(route.params.code ?? ''))
const phase = ref<TJoinPhase>('code')
const preview = ref<IInvitationPreview>({ familyName: '', inviterName: '', role: 'relative', isUsable: false })
const isSignedIn = ref(false)
const isBusy = ref(false)
const name = ref('')
const email = ref('')
const password = ref('')
const secret = ref<IMemberCodeInput | null>(null)
const errorMessage = ref('')

const stepIndex = computed<number>(() => Math.max(0, STEPS.indexOf(phase.value)))
const canContinue = computed<boolean>(() => email.value.trim() !== '' && password.value.length >= MIN_PASSWORD_LENGTH)

const check = async (): Promise<void> => {
    isBusy.value = true
    errorMessage.value = ''
    try {
        preview.value = await loadPreview(code.value.trim())
        phase.value = preview.value.isUsable ? 'profile' : 'invalid'
    } catch (error) {
        errorMessage.value = (error as { statusCode?: number }).statusCode === 429 ? t('join.tooMany') : t('join.failed')
    } finally {
        isBusy.value = false
    }
}

const submit = async (): Promise<void> => {
    isBusy.value = true
    errorMessage.value = ''
    const result = await redeemInvitation({
        code: code.value.trim(),
        name: name.value,
        email: email.value.trim(),
        password: password.value,
        profileCode: secret.value ?? undefined,
    })
    isBusy.value = false
    if (result.status === 'ok') {
        await navigateTo(preview.value.role === 'parent' ? '/profiles' : '/relative')
        return
    }
    if (result.status === 'invalid') {
        phase.value = 'profile'
        errorMessage.value = t('join.invalidCredentials')
        return
    }
    errorMessage.value = t('join.failed')
}

onMounted(async () => {
    isSignedIn.value = await checkSession()
    if (code.value !== '') {
        await check()
    }
})
</script>

<style scoped>
.join__segments {
    display: flex;
    gap: 6px;
    margin: 0;
    padding: 0;
    list-style: none;
}

.join__segment {
    flex: 1;
    height: 14px;
    border: var(--outline) solid var(--ink);
    border-radius: 7px;
    background: var(--paper);
}

.join__segment--on {
    background: var(--yellow);
}

.join__hint {
    margin: 0;
    color: var(--ink-soft);
    font: 600 1.125rem/1.3 var(--font-body);
}

.join__banner {
    margin: 0;
    padding: 14px 16px;
    border: var(--outline) solid var(--ink);
    border-radius: 22px;
    background: var(--sky);
    color: var(--on-accent);
    font: 700 1.125rem/1.3 var(--font-title);
}

.join__code {
    text-align: center;
    letter-spacing: 0.2em;
    font: 700 1.5rem/1.2 var(--font-title);
    text-transform: uppercase;
}

.join__action {
    min-height: 56px;
}
</style>
