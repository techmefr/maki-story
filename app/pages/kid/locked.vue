<template>
    <main class="locked kid-world" data-testid="locked-screen">
        <ChildFoliage />
        <template v-if="isRequestScreen">
            <HomeworkMascot v-if="reason === 'homework'" :size="180" class="locked__maki" />
            <MakiScene v-else :pose="requestPose" :size="180" class="locked__maki" />
            <h1 class="locked__title">{{ t(copy(homework === 'refused' ? 'refusedTitle' : 'title'), { name: current?.name ?? '' }) }}</h1>
            <p class="locked__text" role="status" data-testid="homework-state">{{ t(copy(stateKey)) }}</p>
            <AppButton v-if="homework === 'refused' || homework === 'expired'" variant="secondary" icon="send" :disabled="isAsking" data-testid="homework-ask-again" @click="askAgain">
                {{ t(copy('askAgain')) }}
            </AppButton>
        </template>
        <template v-else>
            <MakiScene :pose="reason === 'night' ? 'moon' : 'hammock'" :size="220" class="locked__maki" />
            <h1 class="locked__title">{{ t('parental.locked.title', { name: current?.name ?? '' }) }}</h1>
            <p v-if="wakeTime" class="locked__text">
                {{ t('parental.locked.wakesAt', { time: wakeTime }) }} {{ t('parental.locked.tomorrow') }}
            </p>
            <PictureClock :time="resumeTime" :label="t('parental.locked.clock')" />
            <AppButton v-if="isExceptionAllowed" variant="secondary" icon="send" :disabled="isAsking" data-testid="exception-ask" @click="askAgain">
                {{ t(`accessControls.locked.${reason}.ask`) }}
            </AppButton>
        </template>
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
import ChildFoliage from '~~/technical/Motion/app/components/ChildFoliage.vue'
definePageMeta({ layout: 'blank' })

const { t, formatDate } = useI18n()
const { current } = useCurrentMember()
const { status, homework, refresh, unlockWithParent, askParents } = useAccess()
const { members } = useMembers()

const isGateOpen = ref(false)
const isGateBusy = ref(false)
const gateError = ref('')
const gateAttempt = ref(0)
const isAsking = ref(false)

const resumeTime = computed(() => (status.value.resumeAt ? new Date(status.value.resumeAt) : null))

const wakeTime = computed(() => (resumeTime.value ? formatDate(resumeTime.value, { timeStyle: 'short' }) : ''))

const reason = computed(() => status.value.reason)

const isAutoAsked = computed(() => reason.value === 'homework' || reason.value === 'approval')

const isExceptionAllowed = computed(() => reason.value === 'night' || reason.value === 'listening')

const isRequestScreen = computed(() => isAutoAsked.value || (isExceptionAllowed.value && homework.value !== 'none'))

const STATE_KEYS: Record<THomeworkGate, string> = { none: 'sending', pending: 'waiting', refused: 'refused', expired: 'expired' }
const stateKey = computed(() => STATE_KEYS[homework.value])

const requestPose = computed(() => (homework.value === 'refused' ? 'sad' : homework.value === 'expired' ? 'tired' : 'anxious'))

const copy = (key: string): string => (reason.value === 'homework' ? `homework.locked.${key}` : `accessControls.locked.${reason.value}.${key}`)

const askAgain = async (): Promise<void> => {
    isAsking.value = true
    try {
        await askParents()
        await refresh()
    } finally {
        isAsking.value = false
    }
}

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

onMounted(async () => {
    await refresh()
    if (isAutoAsked.value && homework.value === 'none') {
        await askAgain()
    }
})
</script>

<style scoped>
@media (max-height: 600px) {
    .locked {
        justify-content: flex-start;
    }

    .locked__maki {
        max-height: 120px;
    }
}

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
    overflow-x: hidden;
    overflow-y: auto;
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
    position: fixed;
    inset-inline: 12px;
    bottom: 12px;
    max-width: calc(100% - 24px);
    max-height: 40dvh;
    overflow: hidden;
    min-height: var(--tap-kid);
    margin-inline: auto;
}
</style>
