<template>
    <form class="stack" data-testid="welcome-child-form" @submit.prevent="save">
        <div class="row" style="justify-content: center">
            <button type="button" class="welcome-photo" :aria-label="t('member.form.changePhoto')" @click="isCapturing = true">
                <AppAvatar :member="preview" :size="96" />
                <span class="badge welcome-photo__badge">{{ photoFileId ? t('member.form.photoChange') : t('member.form.photoNew') }}</span>
            </button>
        </div>
        <label class="stack" style="gap: 6px">
            <span class="label">{{ t('welcome.child.name') }}</span>
            <input v-model="name" class="input" type="text" maxlength="60" required :placeholder="t('member.form.namePlaceholder')" data-testid="welcome-child-name" />
        </label>
        <label class="stack" style="gap: 6px">
            <span class="label">{{ t('welcome.child.birthDate') }}</span>
            <input v-model="birthDate" class="input" type="date" :max="today" required data-testid="welcome-child-birth" />
        </label>
        <div class="stack" style="gap: 6px">
            <span class="label">{{ t('member.form.voiceColor') }}</span>
            <div class="row row--wrap">
                <button
                    v-for="option in colors"
                    :key="option.id"
                    type="button"
                    class="swatch"
                    :style="{ background: option.hex, boxShadow: color === option.id ? swatchRing : 'none' }"
                    :aria-label="option.id"
                    :aria-pressed="color === option.id"
                    @click="color = option.id"
                />
            </div>
        </div>
        <CodeField v-model="code" :can-use-shapes="true" :label="t('welcome.child.code')" />
        <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
        <AppButton is-block class="welcome-child__action" type="submit" :disabled="isBusy || !canSave" data-testid="welcome-child-save">
            <AppIcon name="user-plus" :size="22" motion="bounce" />{{ t('welcome.child.add') }}
        </AppButton>
        <div v-if="isCapturing" class="sheet-backdrop" @click.self="isCapturing = false">
            <div v-sheet="() => (isCapturing = false)" class="sheet stack" role="dialog" aria-modal="true" aria-labelledby="welcome-capture-title">
                <h2 id="welcome-capture-title" class="subtitle">{{ t('member.form.captureTitle') }}</h2>
                <p class="muted">{{ t('member.form.captureHint') }}</p>
                <PhotoCapture :frame-color="getVoiceColor(color).hex" @captured="onCaptured" />
                <AppButton variant="secondary" size="sm" @click="isCapturing = false">{{ t('common.cancel') }}</AppButton>
            </div>
        </div>
    </form>
</template>

<script setup lang="ts">
const emit = defineEmits<{ saved: [member: IMember] }>()

const { t } = useI18n()
const { add, update } = useMembers()
const { upload } = useFiles()
const { register } = useMemberPhotos()

const colors = VOICE_COLORS
const swatchRing = '0 0 0 3px #FFF3DC, 0 0 0 5.5px #1E1A3F'
const today = new Date().toISOString().slice(0, 10)

const name = ref('')
const birthDate = ref('')
const color = ref<VoiceColorId>('sky')
const code = ref<IMemberCodeInput | null>(null)
const photoFileId = ref<string | null>(null)
const isCapturing = ref(false)
const isBusy = ref(false)
const errorMessage = ref('')

const canSave = computed(() => name.value.trim() !== '' && birthDate.value !== '' && code.value !== null)
const preview = computed<IMember>(() => ({
    id: 'new',
    name: name.value || '?',
    role: 'child',
    color: color.value,
    photoFileId: photoFileId.value,
    status: 'active',
    hasCode: false,
    codeKind: null,
    spokenLanguages: [],
    appLocale: null,
    voicePolicy: 'keep',
    isGuest: false,
}))

const onCaptured = async (blob: Blob): Promise<void> => {
    errorMessage.value = ''
    try {
        photoFileId.value = await upload(blob, blob.type)
        register(photoFileId.value, URL.createObjectURL(blob))
        isCapturing.value = false
    } catch (error) {
        console.error('La photo n a pas pu être envoyée', error)
        errorMessage.value = t('member.form.photoError')
    }
}

const reset = (): void => {
    name.value = ''
    birthDate.value = ''
    code.value = null
    photoFileId.value = null
}

const save = async (): Promise<void> => {
    if (!canSave.value) {
        return
    }
    isBusy.value = true
    errorMessage.value = ''
    try {
        const created = await add({ name: name.value, role: 'child', color: color.value, code: code.value ?? undefined, birthDate: birthDate.value })
        if (photoFileId.value) {
            await update(created.id, { photoFileId: photoFileId.value })
        }
        emit('saved', created)
        reset()
    } catch (error) {
        console.error('L enfant n a pas pu être ajouté', error)
        errorMessage.value = t('welcome.child.failed')
    } finally {
        isBusy.value = false
    }
}
</script>

<style scoped>
.welcome-photo {
    position: relative;
    cursor: pointer;
    background: none;
    border: 0;
    padding: 0;
}

.welcome-photo__badge {
    position: absolute;
    inset-inline-end: -10px;
    bottom: -4px;
}

.welcome-child__action {
    min-height: 56px;
}
</style>
