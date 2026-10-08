<template>
    <form v-if="current" class="edit stack" data-testid="profile-edit" @submit.prevent="save">
        <BackLink :to="homePath" />
        <h1 class="edit__title">{{ t('profile.edit.title') }}</h1>
        <button type="button" class="edit__photo" :aria-label="t('profile.menu.changePhoto')" data-testid="edit-photo" @click="isCapturing = true">
            <span class="edit__frame" :style="{ background: memberHex(current) }">
                <img v-if="pendingUrl" :src="pendingUrl" alt="" class="edit__image" />
                <AppAvatar v-else :member="current" :size="124" />
            </span>
            <span class="edit__camera" aria-hidden="true"><AppIcon name="camera" :size="20" /></span>
        </button>
        <label class="edit__field">
            <span class="edit__label">{{ t('member.form.name') }}</span>
            <AppInput v-model="name" class="edit__input" :placeholder="t('member.form.namePlaceholder')" maxlength="60" autocomplete="given-name" data-testid="edit-name" />
        </label>
        <div class="edit__field">
            <label class="edit__label" for="edit-email">{{ t('profile.edit.email') }}</label>
            <div class="edit__locked">
                <AppInput id="edit-email" :model-value="account?.email ?? ''" readonly aria-describedby="edit-email-note" />
                <AppIcon name="lock" :size="20" class="edit__lock" />
            </div>
            <p id="edit-email-note" class="edit__note">{{ account?.hasGoogle ? t('profile.edit.emailGoogle') : t('profile.edit.emailAccount') }}</p>
        </div>
        <button type="button" class="edit__row" data-testid="change-code" @click="isChangingCode = true">
            <AppIcon name="lock" :size="26" />
            <span class="edit__row-text">{{ t('profile.edit.changeCode') }}</span>
            <AppIcon name="chevron-right" :size="20" class="edit__chevron" />
        </button>
        <AppListRow :title="t('profile.edit.account')" to="/family/data">
            <template #lead><AppIcon name="download" :size="26" /></template>
            <template #action><AppIcon name="chevron-right" :size="20" class="edit__chevron" /></template>
        </AppListRow>
        <ProfilePasswordForm v-if="current.role === 'parent'" />
        <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
        <AppButton type="submit" icon="check" is-block class="edit__save" :class="{ 'edit__save--done': isSaved }" :disabled="!canSave || isBusy" data-testid="edit-save">
            {{ isSaved ? t('common.saved') : t('common.save') }}
        </AppButton>
        <AppBottomSheet :open="isCapturing" :title="t('profile.menu.photoTitle')" @close="isCapturing = false">
            <PhotoCapture :frame-color="memberHex(current)" @captured="onCaptured" />
            <AppButton variant="secondary" size="sm" icon="close" @click="isCapturing = false">{{ t('common.cancel') }}</AppButton>
        </AppBottomSheet>
        <ProfileCodeChange :open="isChangingCode" :member="current" @close="isChangingCode = false" />
    </form>
</template>

<script setup lang="ts">
const { t } = useI18n()
const { current, homePath } = useCurrentMember()
const { updateSettings, changePhoto } = useMembers()
const { request } = useApi()

const account = ref<IProfileAccount | null>(null)
const name = ref(current.value?.name ?? '')
const pendingBlob = ref<Blob | null>(null)
const pendingUrl = ref('')
const isCapturing = ref(false)
const isChangingCode = ref(false)
const isBusy = ref(false)
const isSaved = ref(false)
const errorMessage = ref('')

const canSave = computed(() => name.value.trim() !== '')

watch([name, pendingBlob], () => {
    isSaved.value = false
})

const onCaptured = (blob: Blob): void => {
    if (pendingUrl.value) {
        URL.revokeObjectURL(pendingUrl.value)
    }
    pendingBlob.value = blob
    pendingUrl.value = URL.createObjectURL(blob)
    isCapturing.value = false
}

const save = async (): Promise<void> => {
    const member = current.value
    if (!member || !canSave.value) {
        return
    }
    isBusy.value = true
    errorMessage.value = ''
    try {
        if (name.value.trim() !== member.name) {
            await updateSettings(member.id, { name: name.value.trim() })
        }
        if (pendingBlob.value) {
            await changePhoto(member.id, pendingBlob.value)
            pendingBlob.value = null
        }
        isSaved.value = true
    } catch (error) {
        console.error('Le profil n a pas pu être enregistré', error)
        errorMessage.value = t('profile.edit.saveError')
    } finally {
        isBusy.value = false
    }
}

onMounted(async () => {
    try {
        account.value = await request<IProfileAccount>('/members/account')
    } catch (_error) {
        account.value = null
    }
})

onBeforeUnmount(() => {
    if (pendingUrl.value) {
        URL.revokeObjectURL(pendingUrl.value)
    }
})
</script>

<style scoped>
.edit {
    width: 100%;
    max-width: 440px;
    margin: 0 auto;
    gap: 18px;
}

.edit__head {
    gap: 12px;
}

.edit__title {
    margin: 0;
    font: 700 1.875rem/1.1 var(--font-title);
    overflow-wrap: anywhere;
}

.edit__photo {
    position: relative;
    align-self: center;
    padding: 0;
    border: 0;
    background: none;
    cursor: pointer;
}

.edit__frame {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 130px;
    height: 130px;
    overflow: hidden;
    border: var(--outline) solid var(--ink);
    border-radius: 50%;
    box-shadow: var(--shadow-lg);
    color: var(--on-accent);
}

.edit__frame :deep(.avatar) {
    border: 0;
    color: var(--on-accent);
}

.edit__image {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.edit__camera {
    position: absolute;
    inset-inline-end: 6px;
    bottom: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    border: var(--outline) solid var(--ink);
    border-radius: 50%;
    background: var(--yellow);
    color: var(--on-accent);
}

.edit__field {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.edit__label {
    font: 700 1.125rem/1.2 var(--font-title);
}

.edit__field :deep(.input) {
    min-height: 54px;
    padding: 0 22px;
    border-width: var(--outline);
    border-radius: 999px;
    font-size: 1.25rem;
}

.edit__locked {
    position: relative;
}

.edit__locked :deep(.input) {
    padding-inline-end: 52px;
    border-color: var(--grey-line);
    background: var(--grey);
    color: var(--ink-soft);
    font-size: 1.125rem;
    font-weight: 600;
    text-overflow: ellipsis;
}

.edit__lock {
    position: absolute;
    inset-inline-end: 20px;
    top: 50%;
    translate: 0 -50%;
    color: var(--ink-soft);
}

.edit__note {
    margin: 0;
    color: var(--ink-soft);
    font: 500 0.9375rem/1.3 var(--font-body);
}

.edit__row {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: var(--tap);
    padding: 14px 16px;
    border: var(--outline) solid var(--ink);
    border-radius: 22px;
    background: var(--paper);
    box-shadow: var(--shadow);
    color: var(--ink);
    text-align: start;
    cursor: pointer;
}

.edit__row:active {
    transform: translate(3px, 4px);
    box-shadow: var(--shadow-press);
}

.edit__row-text {
    flex: 1;
    font: 700 1.1875rem/1.2 var(--font-title);
}

.edit__chevron {
    flex-shrink: 0;
}

.edit__save {
    margin-top: 6px;
    border-radius: 28px;
    font-size: 1.3125rem;
}

.edit__save--done {
    background: var(--mint-soft);
}

[dir='rtl'] .edit__chevron {
    transform: scaleX(-1);
}
</style>
