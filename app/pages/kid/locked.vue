<template>
    <main class="locked" data-testid="locked-screen">
        <MakiSleeping :size="180" class="locked__maki" />
        <PictureClock :time="resumeTime" :label="t('parental.locked.clock')" />
        <div class="locked__moon" aria-hidden="true">
            <AppIcon name="moon" :size="64" motion="float" />
        </div>
        <AppButton is-round class="locked__parent" :aria-label="t('parental.locked.toParent')" data-testid="locked-parent" @click="isGateOpen = true">
            <AppIcon name="lock" :size="28" />
        </AppButton>
        <ParentGate
            v-if="isGateOpen"
            :members="members"
            :is-busy="isGateBusy"
            :error-message="gateError"
            :attempt="gateAttempt"
            @submit="unlock"
            @cancel="isGateOpen = false"
        />
    </main>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'blank' })

const { t } = useI18n()
const { status, unlockWithParent } = useAccess()
const { members } = useMembers()

const isGateOpen = ref(false)
const isGateBusy = ref(false)
const gateError = ref('')
const gateAttempt = ref(0)

const resumeTime = computed(() => (status.value.resumeAt ? new Date(status.value.resumeAt) : null))

const unlock = async (parentId: string, code: string): Promise<void> => {
    isGateBusy.value = true
    gateError.value = ''
    try {
        await unlockWithParent(parentId, code)
        isGateOpen.value = false
        await navigateTo('/kid')
    } catch (error) {
        const code = (error as { statusCode?: number }).statusCode
        gateError.value = code === 429 ? t('profile.unlock.throttled') : t('parental.gate.wrong')
        gateAttempt.value += 1
    } finally {
        isGateBusy.value = false
    }
}
</script>

<style scoped>
.locked {
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
    padding: 1.5rem;
    background: #3b3470;
    position: relative;
    overflow: hidden;
}

.locked__moon {
    color: #ffc940;
}

.locked__parent {
    position: absolute;
    right: 1rem;
    bottom: 1rem;
    min-width: 4rem;
    min-height: 4rem;
}
</style>
