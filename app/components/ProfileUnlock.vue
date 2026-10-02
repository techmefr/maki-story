<template>
    <div class="stack unlock">
        <AppButton v-if="hasBack" variant="secondary" size="sm" class="unlock__back" @click="emit('cancel')">
            <AppIcon name="back" :size="18" />
            {{ t('profile.switchProfile') }}
        </AppButton>
        <div class="stack unlock__head">
            <AppAvatar :member="member" :size="84" />
            <div class="subtitle">{{ member.name }}</div>
        </div>
        <template v-if="stage === 'offer'">
            <h2 class="subtitle" tabindex="-1">{{ t('profile.unlock.offerTitle') }}</h2>
            <p class="muted">{{ t('profile.unlock.offerBody') }}</p>
            <AppButton is-block :disabled="isBusy" @click="onEnrol">{{ t('profile.unlock.enable') }}</AppButton>
            <AppButton variant="secondary" is-block :disabled="isBusy" @click="onSkipOffer">{{ t('profile.unlock.notNow') }}</AppButton>
            <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
        </template>
        <template v-else-if="mode === 'blocked'">
            <h2 class="subtitle" tabindex="-1">{{ t('profile.unlock.blockedTitle') }}</h2>
            <p class="muted">{{ t('profile.unlock.blockedBody', { name: member.name }) }}</p>
        </template>
        <template v-else>
            <h2 class="subtitle" tabindex="-1">{{ heading }}</h2>
            <p class="muted">{{ hint }}</p>
            <ShapePad v-if="padKind === 'shapes'" :key="padKey" :is-disabled="isBusy" @submit="onCode" />
            <PinPad v-else :key="padKey" :is-disabled="isBusy" @submit="onCode" />
            <AppButton variant="secondary" is-block
                v-for="unlocker in availableUnlockers"
                :key="unlocker.id"
                :disabled="isBusy"
                @click="onUnlocker(unlocker)">
                {{ unlocker.label }}
            </AppButton>
            <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
        </template>
    </div>
</template>

<script setup lang="ts">
const { member, hasBack = true } = defineProps<{ member: IMember; hasBack?: boolean }>()
const emit = defineEmits<{ unlocked: []; cancel: [] }>()

const { t } = useI18n()
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
        return t('profile.unlock.enterTitle')
    }
    return firstEntry.value === null ? t('profile.unlock.createTitle') : t('profile.unlock.confirmTitle')
})
const hint = computed(() => {
    if (mode.value === 'enter') {
        return padKind.value === 'shapes' ? t('profile.unlock.hintShapes') : t('profile.unlock.hintPin')
    }
    return firstEntry.value === null ? t('profile.unlock.hintCreate') : t('profile.unlock.hintConfirm')
})

const resetPad = (): void => {
    padKey.value += 1
}

const fail = (error: unknown): void => {
    const status = (error as { statusCode?: number }).statusCode
    if (status === 403) {
        errorMessage.value = t('profile.unlock.wrong')
    } else if (status === 429) {
        errorMessage.value = t('profile.unlock.throttled')
    } else {
        errorMessage.value = t('profile.unlock.failed')
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
            errorMessage.value = t('profile.unlock.biometricExpired')
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
        errorMessage.value = t('profile.unlock.cancelled')
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
        errorMessage.value = t('profile.unlock.enrolCancelled')
    } catch (_error) {
        errorMessage.value = t('profile.unlock.enrolFailed')
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
        errorMessage.value = t('profile.unlock.mismatch')
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

[dir='rtl'] .unlock__back :deep(svg) {
    transform: scaleX(-1);
}
</style>
