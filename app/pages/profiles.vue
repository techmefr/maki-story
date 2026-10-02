<template>
    <div class="stack profiles">
        <div class="row profiles__bar">
            <AppLogo :size="48" />
            <span class="grow" />
            <button type="button" class="profiles__logout" :aria-label="t('profile.logout')" data-testid="logout" @click="ask('logout')">
                <AppIcon name="logout" :size="28" motion="nudge" />
            </button>
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
            <h1 class="title">{{ t('profile.who') }}</h1>
            <ul class="profiles__grid" role="list">
                <li v-for="(member, index) in members" :key="member.id" class="pop-in" :style="{ '--i': index }">
                    <button
                        type="button"
                        class="card card--tap pop-in profiles__card"
                        :style="{ '--profile-color': memberHex(member) }"
                        :data-role="member.role"
                        @click="target = member"
                    >
                        <AppAvatar :member="member" :size="92" />
                        <span class="subtitle profiles__name">{{ member.name }}</span>
                        <span class="muted">{{ roleLabel(member.role) }}</span>
                    </button>
                </li>
            </ul>
            <div class="stack center profiles__add">
                <button type="button" class="profiles__plus" :aria-label="t('family.index.add')" data-testid="add-member" @click="ask('add')">
                    <AppIcon name="plus" :size="40" motion="bounce" />
                </button>
                <span class="subtitle">{{ t('family.index.add') }}</span>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
type TGateAction = 'add' | 'logout'

definePageMeta({ layout: 'blank' })

const { people: members } = useMembers()
const { select } = useCurrentMember()
const { logout } = useSession()
const { t } = useI18n()

const target = ref<IMember | null>(null)
const gateAction = ref<TGateAction | null>(null)
const isGateBusy = ref(false)
const gateError = ref('')
const gateAttempt = ref(0)

const isGateOpen = computed(() => gateAction.value !== null)
const hasParentCode = computed(() => members.value.some(member => member.role === 'parent' && member.status === 'active' && member.hasCode))

const enter = async (member: IMember): Promise<void> => {
    await navigateTo(member.role === 'child' ? '/kid' : '/home')
}

const perform = async (action: TGateAction): Promise<void> => {
    if (action === 'add') {
        await navigateTo('/family/add')
        return
    }
    await select(null)
    await logout()
}

const ask = async (action: TGateAction): Promise<void> => {
    gateError.value = ''
    if (!hasParentCode.value) {
        await perform(action)
        return
    }
    gateAction.value = action
}

const closeGate = (): void => {
    gateAction.value = null
    gateError.value = ''
}

const onGate = async (parentId: string, code: string): Promise<void> => {
    const action = gateAction.value
    if (!action) {
        return
    }
    isGateBusy.value = true
    gateError.value = ''
    try {
        await select(parentId, { code })
        gateAction.value = null
        await perform(action)
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
.profiles {
    width: 100%;
    max-width: 1120px;
    margin: 0 auto;
    padding: calc(env(safe-area-inset-top) + 12px) 16px calc(env(safe-area-inset-bottom) + 24px);
}

.profiles__bar {
    justify-content: space-between;
}

.profiles__logout {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
    border: 3px solid var(--ink);
    border-radius: 50%;
    background: var(--grey-ui);
    color: var(--ink);
    box-shadow: var(--shadow);
    cursor: pointer;
}

.profiles__grid {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
}

@media (min-width: 720px) {
    .profiles__grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }
}

@media (min-width: 1100px) {
    .profiles__grid {
        grid-template-columns: repeat(4, minmax(0, 1fr));
    }
}

.profiles__card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    text-align: center;
    min-height: 168px;
    border-color: var(--profile-color);
    overflow-wrap: anywhere;
}

.profiles__name {
    max-width: 100%;
}

.profiles__plus {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 84px;
    height: 84px;
    border: 3px solid var(--ink);
    border-radius: 50%;
    background: var(--mint);
    color: var(--on-accent);
    box-shadow: var(--shadow-lg);
    cursor: pointer;
}

.profiles__plus:active {
    transform: translate(3px, 3px);
    box-shadow: 0 0 0 var(--ink);
}
</style>
