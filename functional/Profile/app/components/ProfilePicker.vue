<template>
    <div class="picker-screen stack">
        <div class="row picker-screen__bar">
            <AppLogo :size="52" />
            <span class="grow" />
            <AppButton v-if="!target && !isGateOpen" variant="secondary" icon="logout" class="picker-screen__logout" data-testid="logout" @click="ask">
                {{ t('profile.logout') }}
            </AppButton>
        </div>
        <ProfileUnlock v-if="target" :key="target.id" :member="target" @unlocked="enter(target)" @cancel="target = null" />
        <ParentGate
            v-else-if="isGateOpen"
            :members="members"
            :is-busy="isGateBusy"
            :error-message="gateError"
            :attempt="gateAttempt"
            @submit="onGate"
            @cancel="closeGate"
        />
        <template v-else>
            <h1 class="picker-screen__title">{{ t('profile.who') }}</h1>
            <ul class="picker-screen__grid" role="list">
                <li v-for="(member, index) in members" :key="member.id" class="pop-in" :style="{ '--i': index }">
                    <button
                        type="button"
                        class="card card--tap pop-in picker-screen__card"
                        :style="{ '--profile-color': memberHex(member) }"
                        :data-role="member.role"
                        @click="target = member"
                    >
                        <AppAvatar :member="member" :size="92" />
                        <span class="picker-screen__name">{{ member.name }}</span>
                        <span class="picker-screen__role">{{ roleLabel(member.role) }}</span>
                    </button>
                </li>
            </ul>
        </template>
    </div>
</template>

<script setup lang="ts">
const { people: members } = useMembers()
const { select } = useCurrentMember()
const { logout } = useSession()
const { t } = useI18n()

const target = ref<IMember | null>(null)
const isGateOpen = ref(false)
const isGateBusy = ref(false)
const gateError = ref('')
const gateAttempt = ref(0)

const hasParentCode = computed(() => members.value.some(member => member.role === 'parent' && member.status === 'active' && member.hasCode))

const enter = async (member: IMember): Promise<void> => {
    await navigateTo(member.role === 'child' ? '/kid' : '/home')
}

const perform = async (): Promise<void> => {
    await select(null)
    await logout()
}

const ask = async (): Promise<void> => {
    gateError.value = ''
    if (!hasParentCode.value) {
        await perform()
        return
    }
    isGateOpen.value = true
}

const closeGate = (): void => {
    isGateOpen.value = false
    gateError.value = ''
}

const onGate = async (parentId: string, code: string): Promise<void> => {
    isGateBusy.value = true
    gateError.value = ''
    try {
        await select(parentId, { code })
        isGateOpen.value = false
        await perform()
    } catch (error) {
        const status = (error as { statusCode?: number }).statusCode
        gateError.value = status === 429 ? t('profile.unlock.throttled') : t('parental.gate.wrong')
        gateAttempt.value += 1
    } finally {
        isGateBusy.value = false
    }
}
</script>

<style scoped>
.picker-screen {
    width: 100%;
    max-width: 1120px;
    margin: 0 auto;
    gap: 20px;
    padding: calc(env(safe-area-inset-top) + 12px) 20px calc(env(safe-area-inset-bottom) + 24px);
}

.picker-screen__bar {
    justify-content: space-between;
}

.picker-screen__logout {
    background: var(--grey-ui);
    color: var(--grey-ui-ink);
    border-radius: 999px;
    box-shadow: var(--shadow);
}

.picker-screen__title {
    margin: 0;
    font: 700 2rem/1.1 var(--font-title);
}

.picker-screen__grid {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px;
}

@media (min-width: 720px) {
    .picker-screen__grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }
}

@media (min-width: 1100px) {
    .picker-screen__grid {
        grid-template-columns: repeat(4, minmax(0, 1fr));
    }
}

.picker-screen__card {
    width: 100%;
    min-height: 190px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 18px 10px 16px;
    border: 4px solid var(--profile-color);
    border-radius: 28px;
    background: var(--paper);
    box-shadow: var(--shadow-lg);
    color: var(--ink);
    text-align: center;
    cursor: pointer;
    overflow-wrap: anywhere;
    transition:
        transform 0.15s ease-out,
        box-shadow 0.15s ease-out;
}

.picker-screen__card:active {
    transform: translate(3px, 4px);
    box-shadow: var(--shadow-press);
}

.picker-screen__card :deep(.avatar) {
    margin-bottom: 6px;
    border-width: var(--outline);
    color: var(--on-accent);
}

.picker-screen__name {
    font: 700 1.3125rem/1.15 var(--font-title);
    text-wrap: balance;
}

.picker-screen__role {
    color: var(--ink-soft);
    font: 500 1rem/1.2 var(--font-body);
}

@media (prefers-reduced-motion: reduce) {
    .picker-screen__card {
        transition: none;
    }
}
</style>
