<template>
    <form class="stack" @submit.prevent="save">
        <div class="row" style="justify-content: center">
            <button type="button" class="photo" :aria-label="t('member.form.changePhoto')" @click="isCapturing = true">
                <AppAvatar :member="preview" :size="110" />
                <span class="badge photo__badge">{{ photoFileId ? t('member.form.photoChange') : t('member.form.photoNew') }}</span>
            </button>
        </div>
        <label class="stack" style="gap: 6px">
            <span class="label">{{ t('member.form.name') }}</span>
            <input v-model="name" class="input" :placeholder="t('member.form.namePlaceholder')" required />
        </label>
        <div class="stack" style="gap: 6px">
            <span class="label">{{ t('member.form.role') }}</span>
            <div class="row row--wrap">
                <AppChip
                    v-for="option in roles"
                    :key="option"
                    @click="role = option"
                 :selected="role === option">
                    {{ roleLabel(option) }}
                </AppChip>
            </div>
            <span class="muted">{{ roleHint }}</span>
        </div>
        <CodeField v-if="!member && needsCode" v-model="code" :role="role" :label="t('member.form.codeLabel')" />
        <div v-else-if="member && canChangeCode && needsCode" class="stack" style="gap: 6px">
            <AppButton variant="secondary" size="sm" :aria-expanded="isChangingCode" @click="toggleCodeChange">
                {{ isChangingCode ? t('member.form.keepCode') : member?.hasCode ? t('member.form.changeCode') : t('member.form.setCode') }}
            </AppButton>
            <template v-if="isChangingCode">
                <label v-if="needsCurrentCode" class="stack" style="gap: 6px">
                    <span class="label">{{ t('member.form.currentCode') }}</span>
                    <input v-model="currentCode" class="input" type="password" inputmode="numeric" autocomplete="off" :maxlength="PIN_MAX_LENGTH" />
                </label>
                <CodeField v-model="code" :role="role" :label="t('member.form.newCode')" />
            </template>
        </div>
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
        <AppMoreOptions v-if="canSetChildOptions || canSetLanguages" test-id="member-more-toggle">
            <div v-if="canSetChildOptions" class="stack" style="gap: 6px">
                <label class="stack" style="gap: 6px">
                    <span class="label">{{ t('member.form.birthDate') }}</span>
                    <input v-model="birthDate" class="input" type="date" :max="today" />
                </label>
                <span class="muted">{{ t('member.form.birthDateHint') }}</span>
                <AppChip :selected="isCodeEnabled" @click="isCodeEnabled = !isCodeEnabled">
                    {{ t('member.form.childCodeAsk') }}
                </AppChip>
                <span v-if="!isCodeEnabled" class="muted">{{ t('member.form.childCodeOff') }}</span>
            </div>
            <div v-if="canSetLanguages" class="stack" style="gap: 6px">
                <span class="label">{{ t('member.form.spokenLanguages') }}</span>
                <LanguagePicker v-model="spokenLanguages" :label="t('member.form.spokenLanguages')" :is-disabled="isBusy" />
            </div>
        </AppMoreOptions>
        <div v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</div>
        <AppButton is-block type="submit" :disabled="!canSave || isBusy">{{ t('common.save') }}</AppButton>
        <AppButton variant="secondary" is-block v-if="member" :disabled="isBusy" @click="askRemove">
            {{ t('member.form.remove') }}
        </AppButton>
        <div v-if="isCapturing" class="sheet-backdrop" @click.self="isCapturing = false">
            <div v-sheet="() => (isCapturing = false)" class="sheet stack" role="dialog" aria-modal="true" aria-labelledby="capture-title">
                <h2 id="capture-title" class="subtitle">{{ t('member.form.captureTitle') }}</h2>
                <p class="muted">{{ t('member.form.captureHint') }}</p>
                <PhotoCapture :frame-color="activeHex" @captured="onCaptured" />
                <AppButton variant="secondary" size="sm" @click="isCapturing = false">{{ t('common.cancel') }}</AppButton>
            </div>
        </div>
    </form>
</template>

<script setup lang="ts">
const { t } = useI18n()
const { member = null } = defineProps<{ member?: IMember | null }>()
const emit = defineEmits<{ saved: [] }>()

const { add, update, updateSettings, remove, setCode } = useMembers()
const { current } = useCurrentMember()
const { upload } = useFiles()
const { register } = useMemberPhotos()

const roles: MemberRole[] = ['parent', 'relative', 'child']
const colors = VOICE_COLORS
const swatchRing = '0 0 0 3px #FFF3DC, 0 0 0 5.5px #1E1A3F'

const name = ref(member?.name ?? '')
const role = ref<MemberRole>(member?.role ?? 'relative')
const color = ref<VoiceColorId>(member?.color ?? 'grape')
const photoFileId = ref<string | null>(member?.photoFileId ?? null)
const isBusy = ref(false)
const isCapturing = ref(false)
const activeHex = computed(() => getVoiceColor(color.value).hex)
const errorMessage = ref('')

const spokenLanguages = ref<string[]>([...(member?.spokenLanguages ?? [])])
const code = ref<IMemberCodeInput | null>(null)
const birthDate = ref(member?.birthDate ?? '')
const isCodeEnabled = ref(member?.codeEnabled !== false)
const today = new Date().toISOString().slice(0, 10)
const currentCode = ref('')
const isChangingCode = ref(false)

const isSelf = computed(() => member !== null && member.id === current.value?.id)
const canChangeCode = computed(() => {
    if (!member || !current.value) {
        return false
    }
    return isSelf.value ? current.value.role !== 'child' : current.value.role === 'parent' && !member.isGuest
})
const canSetLanguages = computed(() => {
    if (current.value?.role !== 'parent') {
        return false
    }
    return role.value === 'child' || isSelf.value
})
const hasLanguageChange = computed(() => {
    const before = member?.spokenLanguages ?? []
    return canSetLanguages.value && (spokenLanguages.value.length !== before.length || spokenLanguages.value.some(item => !before.includes(item)))
})
const needsCurrentCode = computed(() => isSelf.value && member?.hasCode === true)
const canSetChildOptions = computed(() => current.value?.role === 'parent' && role.value === 'child' && !(member?.isGuest ?? false))
const needsCode = computed(() => !(role.value === 'child' && !isCodeEnabled.value))
const isCodeReady = computed(() => {
    if (!member) {
        return !needsCode.value || code.value !== null
    }
    if (!isChangingCode.value) {
        return true
    }
    return code.value !== null && (!needsCurrentCode.value || currentCode.value !== '')
})
const canSave = computed(() => name.value.trim() !== '' && isCodeReady.value)

const toggleCodeChange = (): void => {
    isChangingCode.value = !isChangingCode.value
    code.value = null
    currentCode.value = ''
}
const roleHint = computed(() => t(`member.roleHint.${role.value}`))
const preview = computed<IMember>(() => ({
    id: member?.id ?? 'new',
    name: name.value || '?',
    role: role.value,
    color: color.value,
    photoFileId: photoFileId.value,
    status: member?.status ?? 'active',
    hasCode: member?.hasCode ?? false,
    codeKind: member?.codeKind ?? null,
    spokenLanguages: member?.spokenLanguages ?? [],
    appLocale: member?.appLocale ?? null,
    voicePolicy: member?.voicePolicy ?? 'keep',
    isGuest: member?.isGuest ?? false,
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

const childPatch = (): { birthDate?: string | null; codeEnabled?: boolean } => {
    if (!canSetChildOptions.value) {
        return {}
    }
    return { birthDate: birthDate.value === '' ? null : birthDate.value, codeEnabled: isCodeEnabled.value }
}

const save = async (): Promise<void> => {
    if (!canSave.value) {
        return
    }
    isBusy.value = true
    errorMessage.value = ''
    try {
        if (member) {
            await update(member.id, { name: name.value, role: role.value, color: color.value, photoFileId: photoFileId.value, ...childPatch() })
            if (hasLanguageChange.value) {
                await updateSettings(member.id, { spokenLanguages: spokenLanguages.value })
            }
            if (isChangingCode.value && code.value) {
                await setCode(member.id, { ...code.value, currentCode: needsCurrentCode.value ? currentCode.value : undefined })
            }
        } else {
            const created = await add({ name: name.value, role: role.value, color: color.value, code: needsCode.value ? (code.value ?? undefined) : undefined, ...childPatch() })
            if (photoFileId.value) {
                await update(created.id, { photoFileId: photoFileId.value })
            }
            if (hasLanguageChange.value) {
                await updateSettings(created.id, { spokenLanguages: spokenLanguages.value })
            }
        }
        emit('saved')
    } catch (error) {
        console.error('Le proche n a pas pu être enregistré', error)
        const status = (error as { statusCode?: number }).statusCode
        errorMessage.value = status === 403 || status === 429 ? t('member.form.codeBlocked') : t('member.form.saveError')
    } finally {
        isBusy.value = false
    }
}

watch(code, async value => {
    if (member && isChangingCode.value && value?.kind === 'symbols' && canSave.value && !isBusy.value) {
        await save()
    }
})

const askRemove = async (): Promise<void> => {
    if (!member || !window.confirm(t('member.form.removeConfirm', { name: member.name }))) {
        return
    }
    isBusy.value = true
    try {
        await remove(member.id)
        emit('saved')
    } catch (error) {
        console.error('Le proche n a pas pu être supprimé', error)
        errorMessage.value = t('member.form.removeError')
    } finally {
        isBusy.value = false
    }
}
</script>

<style scoped>
.photo {
    position: relative;
    cursor: pointer;
    background: none;
    border: 0;
    padding: 0;
}

.photo__badge {
    position: absolute;
    inset-inline-end: -10px;
    bottom: -4px;
}

</style>
