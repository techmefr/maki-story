<template>
    <div class="stack join">
        <AppStepper v-if="isStepped" :steps="stepperSteps" :current="stepIndex" :label="t('join.steps.label')" />

        <p v-if="isPreviewed" class="join__banner" data-testid="join-family">{{ t(`join.banner.${preview.role}`, { family: preview.familyName }) }}</p>
        <p v-if="isPreviewed && preview.inviterName" class="join__hint">{{ t('join.invitedBy', { name: preview.inviterName }) }}</p>

        <section v-if="phase === 'invalid'" class="stack">
            <AppEmpty :title="t('join.invalidTitle')" :hint="t('join.invalidHint')" />
            <AppButton variant="secondary" is-block class="join__action" icon="back" @click="phase = 'code'">{{ t('join.tryAgain') }}</AppButton>
        </section>

        <section v-else-if="phase === 'oneTap'" class="stack">
            <AppButton is-block class="join__action" icon="user-plus" :disabled="isBusy" data-testid="join-one-tap" @click="submit">
                {{ t('join.oneTap', { family: preview.familyName }) }}
            </AppButton>
            <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
        </section>

        <form v-else class="stack" @submit.prevent="onNext">
            <section v-if="phase === 'code'" class="stack">
                <h1 ref="headingRef" class="title" tabindex="-1">{{ t('join.title') }}</h1>
                <p class="join__hint">{{ t('join.codeHint') }}</p>
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
            </section>

            <section v-else-if="phase === 'name'" class="stack">
                <h1 id="join-step-title" ref="headingRef" class="title" tabindex="-1">{{ t('join.nameLabel') }}</h1>
                <p class="join__hint">{{ t('join.accountHint') }}</p>
                <AppInput v-model="name" type="text" maxlength="60" autocomplete="given-name" aria-labelledby="join-step-title" :placeholder="t('join.namePlaceholder')" data-testid="join-name" />
            </section>

            <section v-else-if="phase === 'email'" class="stack">
                <h1 id="join-step-title" ref="headingRef" class="title" tabindex="-1">{{ t('join.emailLabel') }}</h1>
                <AppInput v-model="email" type="email" autocomplete="email" required aria-labelledby="join-step-title" :placeholder="t('join.emailLabel')" data-testid="join-email" />
            </section>

            <section v-else-if="phase === 'password'" class="stack">
                <h1 id="join-step-title" ref="headingRef" class="title" tabindex="-1">{{ t('join.passwordLabel') }}</h1>
                <AppInput
                    v-model="password"
                    type="password"
                    autocomplete="current-password"
                    minlength="8"
                    required
                    aria-labelledby="join-step-title"
                    :placeholder="t('join.passwordLabel')"
                    data-testid="join-password"
                />
            </section>

            <section v-else class="stack">
                <h1 ref="headingRef" class="title" tabindex="-1">{{ t('join.secretTitle') }}</h1>
                <CodeField v-model="secret" role="parent" :label="t('join.secretHint')" />
            </section>

            <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
            <AppStepNav :next-label="nextLabel" :can-back="canGoBack" :is-disabled="!canContinue" :is-busy="isBusy" :next-test-id="nextTestId" @back="goBack" />
        </form>
    </div>
</template>

<script setup lang="ts">
type TJoinPhase = 'code' | 'invalid' | 'oneTap' | 'name' | 'email' | 'password' | 'secret'

const STEPS: TJoinPhase[] = ['code', 'name', 'email', 'password', 'secret']
const NEXT_TEST_IDS: Partial<Record<TJoinPhase, string>> = { code: 'join-check', secret: 'join-submit' }
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

const headingRef = useStepFocus(() => phase.value)

const isStepped = computed<boolean>(() => STEPS.includes(phase.value))
const isPreviewed = computed<boolean>(() => phase.value !== 'code' && phase.value !== 'invalid')
const stepIndex = computed<number>(() => Math.max(0, STEPS.indexOf(phase.value)))
const stepperSteps = computed(() => STEPS.map(id => ({ id, label: t(`join.steps.${id}`) })))
const canGoBack = computed<boolean>(() => phase.value !== 'code')
const nextTestId = computed<string>(() => NEXT_TEST_IDS[phase.value] ?? 'join-next')
const nextLabel = computed<string>(() => {
    if (phase.value === 'code') {
        return t('join.check')
    }
    return phase.value === 'secret' ? t('join.submit') : t('join.next')
})
const canContinue = computed<boolean>(() => {
    if (phase.value === 'code') {
        return code.value.trim() !== ''
    }
    if (phase.value === 'email') {
        return email.value.trim() !== ''
    }
    if (phase.value === 'password') {
        return password.value.length >= MIN_PASSWORD_LENGTH
    }
    return phase.value !== 'secret' || secret.value !== null
})

const check = async (): Promise<void> => {
    isBusy.value = true
    errorMessage.value = ''
    try {
        preview.value = await loadPreview(code.value.trim())
        if (!preview.value.isUsable) {
            phase.value = 'invalid'
            return
        }
        phase.value = isSignedIn.value ? 'oneTap' : 'name'
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
        phase.value = isSignedIn.value ? 'oneTap' : 'email'
        errorMessage.value = t('join.invalidCredentials')
        return
    }
    errorMessage.value = t('join.failed')
}

const onNext = async (): Promise<void> => {
    if (!canContinue.value) {
        return
    }
    errorMessage.value = ''
    if (phase.value === 'code') {
        await check()
        return
    }
    if (phase.value === 'secret') {
        await submit()
        return
    }
    phase.value = STEPS[stepIndex.value + 1] ?? phase.value
}

const goBack = (): void => {
    errorMessage.value = ''
    phase.value = STEPS[Math.max(0, stepIndex.value - 1)] ?? 'code'
}

onMounted(async () => {
    isSignedIn.value = await checkSession()
    if (code.value !== '') {
        await check()
    }
})
</script>

<style scoped>
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
