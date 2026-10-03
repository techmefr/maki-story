<template>
    <div class="stack invite" data-testid="invite-form">
        <form v-if="!created" class="stack" @submit.prevent="submit">
            <div class="row invite__tabs" role="tablist" :aria-label="t('invite.channelLabel')">
                <AppChip
                    v-for="item in TABS"
                    :key="item.id"
                    role="tab"
                    :selected="tab === item.id"
                    :aria-selected="tab === item.id ? 'true' : 'false'"
                    :data-testid="`invite-tab-${item.id}`"
                    @click="selectTab(item.id)"
                >
                    <AppIcon :name="item.icon" :size="18" />{{ t(`invite.tabs.${item.id}`) }}
                </AppChip>
            </div>
            <div class="stack invite__group" role="group" :aria-label="t('invite.roleLabel')">
                <span class="label">{{ t('invite.roleLabel') }}</span>
                <div class="row">
                    <AppChip v-for="option in ROLES" :key="option" :selected="role === option" :data-testid="`invite-role-${option}`" @click="role = option">
                        {{ t(`invite.roles.${option}`) }}
                    </AppChip>
                </div>
                <span class="invite__hint">{{ t(`invite.roleHint.${role}`) }}</span>
            </div>
            <div v-if="tab === 'code'" class="stack invite__group" role="group" :aria-label="t('invite.channelLabel')">
                <span class="label">{{ t('invite.channelLabel') }}</span>
                <div class="row row--wrap">
                    <AppChip
                        v-for="option in CODE_CHANNELS"
                        :key="option"
                        :selected="channel === option"
                        :data-testid="`invite-channel-${option}`"
                        @click="channel = option"
                    >
                        <AppIcon :name="channelIcon(option)" :size="18" />{{ t(`invite.channels.${option}`) }}
                    </AppChip>
                </div>
            </div>
            <label class="stack invite__group">
                <span class="label">{{ t('invite.nameLabel') }}</span>
                <AppInput v-model="name" type="text" maxlength="60" :placeholder="t('invite.namePlaceholder')" data-testid="invite-name" />
            </label>
            <label v-if="tab === 'email'" class="stack invite__group">
                <span class="label">{{ t('invite.emailLabel') }}</span>
                <AppInput v-model="contact" type="email" inputmode="email" required autocomplete="off" :placeholder="t('invite.emailPlaceholder')" data-testid="invite-contact" />
                <span class="invite__hint">{{ t('invite.emailHint') }}</span>
            </label>
            <label v-else-if="channel === 'SMS' || channel === 'WHATSAPP'" class="stack invite__group">
                <span class="label">{{ t('invite.phoneLabel') }}</span>
                <AppInput v-model="contact" type="tel" autocomplete="off" data-testid="invite-contact" />
            </label>
            <div v-if="children.length > 0" class="stack invite__group" role="group" :aria-label="t('invite.childrenLabel')">
                <span class="label">{{ t('invite.childrenLabel') }}</span>
                <span class="invite__hint">{{ t('invite.childrenHint') }}</span>
                <div class="row row--wrap">
                    <AppChip v-for="child in children" :key="child.id" :selected="childIds.includes(child.id)" @click="toggleChild(child.id)">
                        {{ child.name }}
                    </AppChip>
                </div>
            </div>
            <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
            <AppButton is-block class="invite__action" type="submit" icon="send" :disabled="isBusy" data-testid="invite-create">
                {{ tab === 'email' ? t('invite.sendEmail') : t('invite.create') }}
            </AppButton>
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
        errorMessage.value = (error as { statusCode?: number }).statusCode === 429 ? t('invite.tooMany') : t('invite.createFailed')
    } finally {
        isBusy.value = false
    }
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
