<template>
    <div class="stack unlock">
        <button type="button" class="btn btn--white btn--small unlock__back" @click="emit('cancel')">
            <AppIcon name="back" :size="18" />
            Changer de profil
        </button>
        <div class="stack unlock__head">
            <AppAvatar :member="member" :size="84" />
            <div class="subtitle">{{ member.name }}</div>
        </div>
        <template v-if="mode === 'blocked'">
            <h2 class="subtitle" tabindex="-1">Code à créer</h2>
            <p class="muted">Un parent doit d’abord choisir le code de {{ member.name }}.</p>
        </template>
        <template v-else>
            <h2 class="subtitle" tabindex="-1">{{ heading }}</h2>
            <p class="muted">{{ hint }}</p>
            <ShapePad v-if="padKind === 'shapes'" :key="padKey" :is-disabled="isBusy" @submit="onCode" />
            <PinPad v-else :key="padKey" :is-disabled="isBusy" @submit="onCode" />
            <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
        </template>
    </div>
</template>

<script setup lang="ts">
const { member } = defineProps<{ member: IMember }>()
const emit = defineEmits<{ unlocked: []; cancel: [] }>()

const { select } = useCurrentMember()
const { load } = useMembers()

const padKey = ref(0)
const isBusy = ref(false)
const errorMessage = ref('')
const firstEntry = ref<string | null>(null)

const mode = computed<'enter' | 'create' | 'blocked'>(() => {
    if (member.hasCode) {
        return 'enter'
    }
    return member.role === 'child' ? 'blocked' : 'create'
})
const padKind = computed<MemberCodeKind>(() => (mode.value === 'enter' ? (member.codeKind ?? 'pin') : 'pin'))
const heading = computed(() => {
    if (mode.value === 'enter') {
        return 'Entre ton code'
    }
    return firstEntry.value === null ? 'Crée ton code' : 'Confirme ton code'
})
const hint = computed(() => {
    if (mode.value === 'enter') {
        return padKind.value === 'shapes' ? 'Touche les 3 formes dans le bon ordre.' : 'Tape ton code secret.'
    }
    return firstEntry.value === null ? 'Choisis 4 à 6 chiffres. Il te sera demandé à chaque fois.' : 'Tape le même code une seconde fois.'
})

const resetPad = (): void => {
    padKey.value += 1
}

const fail = (error: unknown): void => {
    const status = (error as { statusCode?: number }).statusCode
    if (status === 403) {
        errorMessage.value = 'Code incorrect. Essaie encore.'
    } else if (status === 429) {
        errorMessage.value = 'Trop d’essais. Réessaie dans quelques minutes.'
    } else {
        errorMessage.value = 'Impossible de continuer pour le moment.'
    }
    resetPad()
}

const unlock = async (proof: IProfileProof): Promise<void> => {
    isBusy.value = true
    errorMessage.value = ''
    try {
        await select(member.id, proof)
        if (proof.newCode) {
            await load()
        }
        emit('unlocked')
    } catch (error) {
        fail(error)
        firstEntry.value = null
    } finally {
        isBusy.value = false
    }
}

const onCode = async (value: string): Promise<void> => {
    if (mode.value === 'enter') {
        await unlock({ code: value })
        return
    }
    if (firstEntry.value === null) {
        firstEntry.value = value
        errorMessage.value = ''
        resetPad()
        return
    }
    if (firstEntry.value !== value) {
        firstEntry.value = null
        errorMessage.value = 'Les deux codes sont différents. Recommence.'
        resetPad()
        return
    }
    await unlock({ newCode: { kind: 'pin', value } })
}
</script>

<style scoped>
.unlock {
    align-items: center;
    text-align: center;
}

.unlock__back {
    align-self: flex-start;
}

.unlock__head {
    align-items: center;
}
</style>
