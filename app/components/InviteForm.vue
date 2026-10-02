<template>
    <div class="stack invite" data-testid="invite-form">
        <form v-if="!created" class="stack" @submit.prevent="submit">
            <div class="stack invite__group" role="group" :aria-label="t('invite.channelLabel')">
                <span class="label">{{ t('invite.channelLabel') }}</span>
                <div class="row row--wrap">
                    <button
                        v-for="option in CHANNELS"
                        :key="option"
                        type="button"
                        class="chip invite__chip"
                        :class="{ 'chip--on': channel === option }"
                        :aria-pressed="channel === option"
                        :data-testid="`invite-channel-${option}`"
                        @click="channel = option"
                    >
                        <AppIcon :name="channelIcon(option)" :size="18" />{{ t(`invite.channels.${option}`) }}
                    </button>
                </div>
            </div>
            <label class="stack invite__group">
                <span class="label">{{ t('invite.nameLabel') }}</span>
                <input v-model="name" class="input" type="text" maxlength="60" :placeholder="t('invite.namePlaceholder')" data-testid="invite-name" />
            </label>
            <label v-if="channel !== 'LINK'" class="stack invite__group">
                <span class="label">{{ channel === 'EMAIL' ? t('invite.emailLabel') : t('invite.phoneLabel') }}</span>
                <input
                    v-model="contact"
                    class="input"
                    :type="channel === 'EMAIL' ? 'email' : 'tel'"
                    :required="channel === 'EMAIL'"
                    autocomplete="off"
                    data-testid="invite-contact"
                />
            </label>
            <div v-if="children.length > 0" class="stack invite__group" role="group" :aria-label="t('invite.childrenLabel')">
                <span class="label">{{ t('invite.childrenLabel') }}</span>
                <span class="muted">{{ t('invite.childrenHint') }}</span>
                <div class="row row--wrap">
                    <button
                        v-for="child in children"
                        :key="child.id"
                        type="button"
                        class="chip invite__chip"
                        :class="{ 'chip--on': childIds.includes(child.id) }"
                        :aria-pressed="childIds.includes(child.id)"
                        @click="toggleChild(child.id)"
                    >
                        {{ child.name }}
                    </button>
                </div>
            </div>
            <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
            <AppButton is-block class="invite__action" type="submit" :disabled="isBusy" data-testid="invite-create">
                <AppIcon name="send" :size="22" motion="nudge" />{{ t('invite.create') }}
            </AppButton>
        </form>
        <div v-else class="stack" data-testid="invite-result">
            <h2 class="subtitle">{{ t('invite.ready') }}</h2>
            <p class="muted">{{ t('invite.validFor', { hours: hoursLeft }) }}</p>
            <input class="input invite__link" type="text" readonly :value="created.link" :aria-label="t('invite.linkLabel')" data-testid="invite-link" @focus="selectAll" />
            <p v-if="created.channel === 'EMAIL'" class="muted" role="status">
                {{ created.isEmailSent ? t('invite.emailSent', { contact: created.contact }) : t('invite.emailNotSent') }}
            </p>
            <AppButton is-block class="invite__action" v-if="canShare" data-testid="invite-share" @click="share">
                <AppIcon name="send" :size="22" />{{ t('invite.share') }}
            </AppButton>
            <AppButton is-block as="a" class="invite__action" v-if="created.channel === 'WHATSAPP'" :href="whatsappUrl" target="_blank" rel="noopener" data-testid="invite-whatsapp">
                <AppIcon name="message" :size="22" />{{ t('invite.openWhatsapp') }}
            </AppButton>
            <AppButton is-block as="a" class="invite__action" v-if="created.channel === 'SMS'" :href="smsUrl" data-testid="invite-sms">
                <AppIcon name="message" :size="22" />{{ t('invite.openSms') }}
            </AppButton>
            <AppButton variant="secondary" is-block class="invite__action" data-testid="invite-copy" @click="copy">
                <AppIcon :name="isCopied ? 'check' : 'download'" :size="22" />{{ isCopied ? t('invite.copied') : t('invite.copy') }}
            </AppButton>
            <AppButton variant="secondary" is-block class="invite__action" @click="reset">
                <AppIcon name="user-plus" :size="22" />{{ t('invite.another') }}
            </AppButton>
        </div>
    </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{ created: [invitation: IInvitationCreated] }>()

const CHANNELS: InvitationChannel[] = ['WHATSAPP', 'SMS', 'EMAIL', 'LINK']
const EXPIRY_HOURS = 72

const { t } = useI18n()
const { create } = useInvitations()
const { children, ensureLoaded } = useMembers()

const channel = ref<InvitationChannel>('WHATSAPP')
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

const channelIcon = (option: InvitationChannel): IconName => (option === 'LINK' ? 'download' : option === 'EMAIL' ? 'send' : 'message')

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

.invite__chip,
.invite__action {
    min-height: 48px;
}

.invite__link {
    overflow: hidden;
    text-overflow: ellipsis;
}
</style>
