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
        <template v-if="stage === 'offer'">
            <h2 class="subtitle" tabindex="-1">Activer l’empreinte ou le visage ?</h2>
            <p class="muted">Tu pourras ouvrir ton profil sans taper ton code sur cet appareil. Le code reste disponible.</p>
            <button type="button" class="btn btn--block" :disabled="isBusy" @click="onEnrol">Activer</button>
            <button type="button" class="btn btn--white btn--block" :disabled="isBusy" @click="onSkipOffer">Pas maintenant</button>
            <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
        </template>
        <template v-else-if="mode === 'blocked'">
            <h2 class="subtitle" tabindex="-1">Code à créer</h2>
            <p class="muted">Un parent doit d’abord choisir le code de {{ member.name }}.</p>
        </template>
        <template v-else>
            <h2 class="subtitle" tabindex="-1">{{ heading }}</h2>
            <p class="muted">{{ hint }}</p>
            <ShapePad v-if="padKind === 'shapes'" :key="padKey" :is-disabled="isBusy" @submit="onCode" />
            <PinPad v-else :key="padKey" :is-disabled="isBusy" @submit="onCode" />
            <button
                v-for="unlocker in availableUnlockers"
                :key="unlocker.id"
                type="button"
                class="btn btn--white btn--block"
                :disabled="isBusy"
                @click="onUnlocker(unlocker)"
            >
                {{ unlocker.label }}
            </button>
            <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
        </template>
    </div>
</template>

<script setup lang="ts">
const { member } = defineProps<{ member: IMember }>()
const emit = defineEmits<{ unlocked: []; cancel: [] }>()

const { select } = useCurrentMember()
const { load } = useMembers()
const { unlockers } = useProfileUnlockers()
const biometric = useBiometric()

const padKey = ref(0)
const isBusy = ref(false)
const errorMessage = ref('')
const firstEntry = ref<string | null>(null)
const stage = ref<'code' | 'offer'>('code')
const availableUnlockers = ref<IProfileUnlocker[]>([])

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
        if (!proof.device && (await shouldOfferBiometric())) {
            stage.value = 'offer'
            return
        }
        emit('unlocked')
    } catch (error) {
        fail(error)
        firstEntry.value = null
        if (proof.device) {
            await biometric.forget(member.id)
            availableUnlockers.value = availableUnlockers.value.filter(item => item.id !== 'biometric')
            errorMessage.value = 'L’empreinte n’est plus valable. Utilise ton code.'
        }
    } finally {
        isBusy.value = false
    }
}

const shouldOfferBiometric = async (): Promise<boolean> => {
    if (biometric.isDeclined(member.id) || !(await biometric.detect())) {
        return false
    }
    return !(await biometric.isEnrolled(member.id))
}

const onUnlocker = async (unlocker: IProfileUnlocker): Promise<void> => {
    isBusy.value = true
    errorMessage.value = ''
    let proof: IProfileProof | null = null
    try {
        proof = await unlocker.prove(member.id)
    } catch (_error) {
        proof = null
    }
    isBusy.value = false
    if (!proof) {
        errorMessage.value = 'Vérification annulée. Tape ton code.'
        return
    }
    await unlock(proof)
}

const onEnrol = async (): Promise<void> => {
    isBusy.value = true
    errorMessage.value = ''
    try {
        if (await biometric.enrol(member.id)) {
            emit('unlocked')
            return
        }
        errorMessage.value = 'Vérification annulée. Tu pourras réessayer plus tard.'
    } catch (_error) {
        errorMessage.value = 'Impossible d’activer pour le moment.'
    } finally {
        isBusy.value = false
    }
}

const onSkipOffer = (): void => {
    biometric.decline(member.id)
    emit('unlocked')
}

onMounted(async () => {
    if (mode.value !== 'enter') {
        return
    }
    const checks = await Promise.all(
        unlockers.value.map(async unlocker => ((await unlocker.isAvailable(member.id).catch(() => false)) ? unlocker : null)),
    )
    availableUnlockers.value = checks.filter((item): item is IProfileUnlocker => item !== null)
})

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
