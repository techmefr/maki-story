<template>
    <form class="stack" @submit.prevent="save">
        <div class="row" style="justify-content: center">
            <label class="photo">
                <AppAvatar :member="preview" :size="96" />
                <span class="badge photo__badge">Photo</span>
                <input type="file" accept="image/*" hidden @change="pickPhoto" />
            </label>
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
        <div v-if="errorMessage" class="error">{{ errorMessage }}</div>
        <button type="submit" class="btn btn--block" :disabled="!canSave || isBusy">Enregistrer</button>
        <button v-if="member" type="button" class="btn btn--white btn--block" :disabled="isBusy" @click="askRemove">
            Supprimer ce proche
        </button>
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

const { add, update, remove } = useMembers()
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
const errorMessage = ref('')

const canSave = computed(() => name.value.trim() !== '')
const roleHint = computed(() => ROLE_HINTS[role.value])
const preview = computed<IMember>(() => ({
    id: member?.id ?? 'new',
    name: name.value || '?',
    role: role.value,
    color: color.value,
    photoFileId: photoFileId.value,
}))

const pickPhoto = async (event: Event): Promise<void> => {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) {
        return
    }
    try {
        const blob = await compressImage(file)
        photoFileId.value = await upload(blob, 'image/jpeg')
        register(photoFileId.value, URL.createObjectURL(blob))
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
        } else {
            const created = await add({ name: name.value, role: role.value, color: color.value })
            if (photoFileId.value) {
                await update(created.id, { photoFileId: photoFileId.value })
            }
        }
        emit('saved')
    } catch (error) {
        console.error('Le proche n a pas pu être enregistré', error)
        errorMessage.value = 'Impossible d’enregistrer pour le moment.'
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
