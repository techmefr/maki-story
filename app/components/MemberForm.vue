<template>
    <form class="stack" @submit.prevent="save">
        <div class="row" style="justify-content: center">
            <button type="button" class="photo" aria-label="Changer la photo" @click="isCapturing = true">
                <AppAvatar :member="preview" :size="110" />
                <span class="badge photo__badge">{{ photoFileId ? 'Changer' : 'Grimace !' }}</span>
            </button>
        </div>
        <label class="stack" style="gap: 6px">
            <span class="label">Prénom</span>
            <input v-model="name" class="input" placeholder="Maman, Mamie, Lova…" required />
        </label>
        <div class="stack" style="gap: 6px">
            <span class="label">Rôle</span>
            <div class="row row--wrap">
                <button
                    v-for="option in roles"
                    :key="option"
                    type="button"
                    class="chip"
                    :class="{ 'chip--on': role === option }"
                    @click="role = option"
                >
                    {{ roleLabel(option) }}
                </button>
            </div>
            <span class="muted">{{ roleHint }}</span>
        </div>
        <CodeField v-if="!member" v-model="code" :can-use-shapes="role === 'child'" label="Code secret du profil" />
        <div v-else-if="canChangeCode" class="stack" style="gap: 6px">
            <button type="button" class="btn btn--white btn--small" :aria-expanded="isChangingCode" @click="toggleCodeChange">
                {{ isChangingCode ? 'Garder le code actuel' : 'Changer le code' }}
            </button>
            <template v-if="isChangingCode">
                <label v-if="needsCurrentCode" class="stack" style="gap: 6px">
                    <span class="label">Code actuel</span>
                    <input v-model="currentCode" class="input" type="password" inputmode="numeric" autocomplete="off" :maxlength="PIN_MAX_LENGTH" />
                </label>
                <CodeField v-model="code" :can-use-shapes="role === 'child'" label="Nouveau code" />
            </template>
        </div>
        <div class="stack" style="gap: 6px">
            <span class="label">Couleur de voix</span>
            <div class="row row--wrap">
                <button
                    v-for="option in colors"
                    :key="option.id"
                    type="button"
                    class="swatch"
                    :style="{ background: option.hex, boxShadow: color === option.id ? swatchRing : 'none' }"
                    :aria-label="option.id"
                    @click="color = option.id"
                />
            </div>
        </div>
        <div v-if="canSetLanguages" class="stack" style="gap: 6px">
            <span class="label">Langues parlées</span>
            <LanguagePicker v-model="spokenLanguages" label="Langues parlées" :is-disabled="isBusy" />
        </div>
        <div v-if="errorMessage" class="error">{{ errorMessage }}</div>
        <button type="submit" class="btn btn--block" :disabled="!canSave || isBusy">Enregistrer</button>
        <button v-if="member" type="button" class="btn btn--white btn--block" :disabled="isBusy" @click="askRemove">
            Supprimer ce proche
        </button>
        <div v-if="isCapturing" class="sheet-backdrop" @click.self="isCapturing = false">
            <div class="sheet stack">
                <h2 class="subtitle">Ta plus belle grimace</h2>
                <p class="muted">Chacun fait une grimace différente : l’enfant reconnaîtra ses proches.</p>
                <PhotoCapture :frame-color="activeHex" @captured="onCaptured" />
                <button type="button" class="btn btn--white btn--small" @click="isCapturing = false">Annuler</button>
            </div>
        </div>
    </form>
</template>

<script setup lang="ts">
const ROLE_HINTS: Record<MemberRole, string> = {
    parent: 'Peut créer des livres et gérer la famille.',
    relative: 'Enregistre des histoires et laisse des messages à l’enfant.',
    child: 'Écoute les histoires, sans réglages ni création.',
}

const { member = null } = defineProps<{ member?: IMember | null }>()
const emit = defineEmits<{ saved: [] }>()

const { add, update, updateSettings, remove, setCode } = useMembers()
const { current } = useCurrentMember()
const { upload } = useFiles()
const { register } = useMemberPhotos()

const roles: MemberRole[] = ['parent', 'relative', 'child']
const colors = VOICE_COLORS
const swatchRing = '0 0 0 3px #FFF4D9, 0 0 0 5.5px #1F1B3A'

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
const currentCode = ref('')
const isChangingCode = ref(false)

const isSelf = computed(() => member !== null && member.id === current.value?.id)
const canChangeCode = computed(() => {
    if (!member || !current.value) {
        return false
    }
    return isSelf.value ? current.value.role !== 'child' : current.value.role === 'parent' && member.role !== 'parent'
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
const isCodeReady = computed(() => {
    if (!member) {
        return code.value !== null
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
const roleHint = computed(() => ROLE_HINTS[role.value])
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
        errorMessage.value = 'La photo n’a pas pu être envoyée.'
    }
}

const save = async (): Promise<void> => {
    if (!canSave.value) {
        return
    }
    isBusy.value = true
    errorMessage.value = ''
    try {
        if (member) {
            await update(member.id, { name: name.value, role: role.value, color: color.value, photoFileId: photoFileId.value })
            if (hasLanguageChange.value) {
                await updateSettings(member.id, { spokenLanguages: spokenLanguages.value })
            }
            if (isChangingCode.value && code.value) {
                await setCode(member.id, { ...code.value, currentCode: needsCurrentCode.value ? currentCode.value : undefined })
            }
        } else {
            const created = await add({ name: name.value, role: role.value, color: color.value, code: code.value ?? undefined })
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
        errorMessage.value = status === 403 || status === 429 ? 'Le code actuel est incorrect ou bloqué.' : 'Impossible d’enregistrer pour le moment.'
    } finally {
        isBusy.value = false
    }
}

const askRemove = async (): Promise<void> => {
    if (!member || !window.confirm(`Supprimer ${member.name} ? Ses enregistrements seront perdus.`)) {
        return
    }
    isBusy.value = true
    try {
        await remove(member.id)
        emit('saved')
    } catch (error) {
        console.error('Le proche n a pas pu être supprimé', error)
        errorMessage.value = 'Impossible de supprimer : il faut garder au moins un parent.'
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
    right: -10px;
    bottom: -4px;
}

.swatch {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 2.5px solid var(--ink);
    cursor: pointer;
}
</style>
