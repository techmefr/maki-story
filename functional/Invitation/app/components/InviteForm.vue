<template>
    <div class="stack invite" data-testid="invite-form">
        <form v-if="!created" class="stack" @submit.prevent="onNext">
            <AppStepper :steps="stepperSteps" :current="stepIndex" :label="t('invite.steps.label')" />

            <section v-if="step === 'tab'" class="stack invite__group" role="group" aria-labelledby="invite-step-title">
                <h2 id="invite-step-title" ref="headingRef" class="subtitle" tabindex="-1">{{ t('invite.channelLabel') }}</h2>
                <div class="row invite__tabs">
                    <AppChip v-for="item in TABS" :key="item.id" :selected="tab === item.id" :data-testid="`invite-tab-${item.id}`" @click="selectTab(item.id)">
                        <AppIcon :name="item.icon" :size="18" />{{ t(`invite.tabs.${item.id}`) }}
                    </AppChip>
                </div>
            </section>

            <section v-else-if="step === 'channel'" class="stack invite__group" role="group" aria-labelledby="invite-step-title">
                <h2 id="invite-step-title" ref="headingRef" class="subtitle" tabindex="-1">{{ t('invite.codeChannelLabel') }}</h2>
                <div class="row row--wrap">
                    <AppChip v-for="option in CODE_CHANNELS" :key="option" :selected="channel === option" :data-testid="`invite-channel-${option}`" @click="channel = option">
                        <AppIcon :name="channelIcon(option)" :size="18" />{{ t(`invite.channels.${option}`) }}
                    </AppChip>
                </div>
            </section>

            <section v-else-if="step === 'role'" class="stack invite__group" role="group" aria-labelledby="invite-step-title">
                <h2 id="invite-step-title" ref="headingRef" class="subtitle" tabindex="-1">{{ t('invite.roleLabel') }}</h2>
                <div class="row">
                    <AppChip v-for="option in ROLES" :key="option" :selected="role === option" :data-testid="`invite-role-${option}`" @click="role = option">
                        {{ t(`invite.roles.${option}`) }}
                    </AppChip>
                </div>
                <span class="invite__hint">{{ t(`invite.roleHint.${role}`) }}</span>
            </section>

            <section v-else-if="step === 'name'" class="stack invite__group">
                <h2 id="invite-step-title" ref="headingRef" class="subtitle" tabindex="-1">{{ t('invite.nameLabel') }}</h2>
                <AppInput v-model="name" type="text" maxlength="60" aria-labelledby="invite-step-title" :placeholder="t('invite.namePlaceholder')" data-testid="invite-name" />
            </section>

            <section v-else-if="step === 'contact'" class="stack invite__group">
                <template v-if="tab === 'email'">
                    <h2 id="invite-step-title" ref="headingRef" class="subtitle" tabindex="-1">{{ t('invite.emailLabel') }}</h2>
                    <AppInput
                        v-model="contact"
                        type="email"
                        inputmode="email"
                        required
                        autocomplete="off"
                        aria-labelledby="invite-step-title"
                        :placeholder="t('invite.emailPlaceholder')"
                        data-testid="invite-contact"
                    />
                    <span class="invite__hint">{{ t('invite.emailHint') }}</span>
                </template>
                <template v-else>
                    <h2 id="invite-step-title" ref="headingRef" class="subtitle" tabindex="-1">{{ t('invite.phoneLabel') }}</h2>
                    <AppInput v-model="contact" type="tel" autocomplete="off" aria-labelledby="invite-step-title" data-testid="invite-contact" />
                </template>
            </section>

            <section v-else class="stack invite__group" role="group" aria-labelledby="invite-step-title">
                <h2 id="invite-step-title" ref="headingRef" class="subtitle" tabindex="-1">{{ t('invite.childrenLabel') }}</h2>
                <span class="invite__hint">{{ t('invite.childrenHint') }}</span>
                <div class="row row--wrap">
                    <AppChip v-for="child in children" :key="child.id" :selected="childIds.includes(child.id)" @click="toggleChild(child.id)">
                        {{ child.name }}
                    </AppChip>
                </div>
            </section>

            <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
            <AppStepNav
                :next-label="nextLabel"
                :can-back="stepIndex > 0"
                :is-disabled="!canContinue"
                :is-busy="isBusy"
                :next-test-id="isLast ? 'invite-create' : 'invite-next'"
                @back="goBack"
            />
        </form>
        <div v-else class="stack" data-testid="invite-result">
            <h2 class="subtitle">{{ created.channel === 'EMAIL' ? t('invite.sentTitle') : t('invite.ready') }}</h2>
            <template v-if="created.channel !== 'EMAIL'">
                <div class="invite__code" data-testid="invite-code" :aria-label="t('invite.codeLabel')">{{ created.code }}</div>
                <p class="invite__hint">{{ t('invite.validFor', { hours: hoursLeft }) }}</p>
                <input class="input invite__link" type="text" readonly :value="created.link" :aria-label="t('invite.linkLabel')" data-testid="invite-link" @focus="selectAll" />
            </template>
            <p v-else class="invite__hint" role="status">
                {{ created.isEmailSent ? t('invite.emailSent', { contact: created.contact }) : t('invite.emailNotSent') }}
            </p>
            <AppButton v-if="canShare" is-block class="invite__action" icon="send" data-testid="invite-share" @click="share">{{ t('invite.share') }}</AppButton>
            <AppButton
                v-if="created.channel === 'WHATSAPP'"
                is-block
                as="a"
                class="invite__action"
                icon="message"
                :href="whatsappUrl"
                target="_blank"
                rel="noopener"
                data-testid="invite-whatsapp"
            >
                {{ t('invite.openWhatsapp') }}
            </AppButton>
            <AppButton v-if="created.channel === 'SMS'" is-block as="a" class="invite__action" icon="message" :href="smsUrl" data-testid="invite-sms">
                {{ t('invite.openSms') }}
            </AppButton>
            <AppButton variant="secondary" is-block class="invite__action" :icon="isCopied ? 'check' : 'download'" data-testid="invite-copy" @click="copy">
                {{ isCopied ? t('invite.copied') : t('invite.copy') }}
            </AppButton>
            <AppButton variant="secondary" is-block class="invite__action" icon="user-plus" @click="reset">{{ t('invite.another') }}</AppButton>
        </div>
    </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{ created: [invitation: IInvitationCreated] }>()

type TInviteTab = 'email' | 'code'
type TInviteStep = 'tab' | 'channel' | 'role' | 'name' | 'contact' | 'children'

const TABS: { id: TInviteTab; icon: IconName }[] = [
    { id: 'email', icon: 'send' },
    { id: 'code', icon: 'lock' },
]
const ROLES: InvitationRole[] = ['relative', 'parent']
const CODE_CHANNELS: InvitationChannel[] = ['LINK', 'WHATSAPP', 'SMS']
const EXPIRY_HOURS = 48

const { t } = useI18n()
const { create } = useInvitations()
const { children, ensureLoaded } = useMembers()

const tab = ref<TInviteTab>('email')
const role = ref<InvitationRole>('relative')
const channel = ref<InvitationChannel>('EMAIL')
const name = ref('')
const contact = ref('')
const childIds = ref<string[]>([])
const created = ref<IInvitationCreated | null>(null)
const isBusy = ref(false)
const isCopied = ref(false)
const errorMessage = ref('')
const step = ref<TInviteStep>('tab')

const headingRef = useStepFocus(() => step.value)

const needsContact = computed<boolean>(() => tab.value === 'email' || channel.value === 'SMS' || channel.value === 'WHATSAPP')
const steps = computed<TInviteStep[]>(() => {
    const list: TInviteStep[] = ['tab']
    if (tab.value === 'code') {
        list.push('channel')
    }
    list.push('role', 'name')
    if (needsContact.value) {
        list.push('contact')
    }
    if (children.value.length > 0) {
        list.push('children')
    }
    return list
})
const stepIndex = computed<number>(() => Math.max(0, steps.value.indexOf(step.value)))
const isLast = computed<boolean>(() => stepIndex.value === steps.value.length - 1)
const stepperSteps = computed(() => steps.value.map(id => ({ id, label: t(`invite.steps.${id}`) })))
const canContinue = computed<boolean>(() => step.value !== 'contact' || tab.value !== 'email' || contact.value.trim() !== '')
const nextLabel = computed<string>(() => {
    if (!isLast.value) {
        return t('common.next')
    }
    return tab.value === 'email' ? t('invite.sendEmail') : t('invite.create')
})

const canShare = computed(() => import.meta.client && typeof navigator.share === 'function')
const hoursLeft = computed(() => (created.value ? Math.max(1, Math.round((new Date(created.value.expiresAt).getTime() - Date.now()) / 3_600_000)) : EXPIRY_HOURS))
const whatsappUrl = computed(() => `https://wa.me/?text=${encodeURIComponent(created.value?.shareText ?? '')}`)
const smsUrl = computed(() => `sms:${encodeURIComponent(created.value?.contact ?? '')}?body=${encodeURIComponent(created.value?.shareText ?? '')}`)

const CHANNEL_ICONS: Record<InvitationChannel, IconName> = { LINK: 'download', EMAIL: 'send', WHATSAPP: 'message', SMS: 'message' }

const channelIcon = (option: InvitationChannel): IconName => CHANNEL_ICONS[option]

const selectTab = (id: TInviteTab): void => {
    tab.value = id
    channel.value = id === 'email' ? 'EMAIL' : 'LINK'
}

const toggleChild = (id: string): void => {
    childIds.value = childIds.value.includes(id) ? childIds.value.filter(item => item !== id) : [...childIds.value, id]
}

const selectAll = (event: Event): void => (event.target as HTMLInputElement).select()

const submit = async (): Promise<void> => {
    isBusy.value = true
    errorMessage.value = ''
    try {
        created.value = await create({
            channel: channel.value,
            role: role.value,
            contact: contact.value,
            name: name.value,
            childIds: childIds.value,
            expiresInHours: EXPIRY_HOURS,
        })
        emit('created', created.value)
    } catch (error) {
        console.error('L invitation n a pas pu être créée', error)
        const status = (error as { statusCode?: number }).statusCode
        errorMessage.value = status === 429 ? t('invite.tooMany') : status === 402 ? errorText(error, 'invite.createFailed') : t('invite.createFailed')
    } finally {
        isBusy.value = false
    }
}

const onNext = async (): Promise<void> => {
    if (!canContinue.value) {
        return
    }
    if (isLast.value) {
        await submit()
        return
    }
    step.value = steps.value[stepIndex.value + 1] ?? step.value
}

const goBack = (): void => {
    errorMessage.value = ''
    step.value = steps.value[Math.max(0, stepIndex.value - 1)] ?? 'tab'
}

const share = async (): Promise<void> => {
    if (!created.value) {
        return
    }
    try {
        await navigator.share({ text: created.value.shareText, url: created.value.link })
    } catch (_error) {
        console.warn('Le partage a été annulé')
    }
}

const copy = async (): Promise<void> => {
    try {
        await navigator.clipboard.writeText(created.value?.link ?? '')
        isCopied.value = true
    } catch (_error) {
        isCopied.value = false
    }
}

const reset = (): void => {
    created.value = null
    isCopied.value = false
    name.value = ''
    contact.value = ''
    childIds.value = []
    step.value = 'tab'
}

onMounted(ensureLoaded)
</script>

<style scoped>
.invite__group {
    gap: 6px;
}

.invite__action {
    min-height: 48px;
}

.invite__tabs {
    gap: 8px;
}

.invite__hint {
    color: var(--ink-soft);
    font: 600 0.875rem/1.3 var(--font-body);
}

.invite__code {
    align-self: center;
    padding: 12px 24px;
    border: var(--outline) solid var(--ink);
    border-radius: 22px;
    background: var(--paper);
    box-shadow: var(--shadow);
    font: 700 2rem/1.1 var(--font-title);
    letter-spacing: 0.2em;
    text-transform: uppercase;
}

.invite__link {
    overflow: hidden;
    text-overflow: ellipsis;
}
</style>
