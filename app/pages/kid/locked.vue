<template>
    <main class="locked" data-testid="locked-screen">
        <MakiSleeping :size="180" class="locked__maki" />
        <h1 class="locked__title">{{ t('parental.locked.title', { name: current?.name ?? '' }) }}</h1>
        <p v-if="wakeTime" class="locked__text">
            {{ t('parental.locked.wakesAt', { time: wakeTime }) }} {{ t('parental.locked.tomorrow') }}
        </p>
        <PictureClock :time="resumeTime" :label="t('parental.locked.clock')" />
        <AppButton class="locked__parent" icon="lock" data-testid="locked-parent" @click="isGateOpen = true">
            {{ t('parental.locked.toParent') }}
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

const { t, formatDate } = useI18n()
const { current } = useCurrentMember()
const { status, unlockWithParent } = useAccess()
const { members } = useMembers()

const isGateOpen = ref(false)
const isGateBusy = ref(false)
const gateError = ref('')
const gateAttempt = ref(0)

const resumeTime = computed(() => (status.value.resumeAt ? new Date(status.value.resumeAt) : null))

const wakeTime = computed(() => (resumeTime.value ? formatDate(resumeTime.value, { timeStyle: 'short' }) : ''))

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
    gap: 1.25rem;
    padding: 1.5rem 1.5rem 6rem;
    background: var(--violet);
    color: var(--on-accent);
    text-align: center;
    position: relative;
    overflow: hidden;
}

.locked__title {
    margin: 0;
    font: 700 2rem/1.1 var(--font-title);
}

.locked__text {
    margin: 0;
    max-width: 20rem;
    font: 600 1.125rem/1.3 var(--font-body);
}

.locked__parent {
    position: absolute;
    inset-inline: 1rem;
    bottom: 1rem;
    max-width: calc(100% - 2rem);
    min-height: var(--tap-kid);
    margin-inline: auto;
}
</style>
