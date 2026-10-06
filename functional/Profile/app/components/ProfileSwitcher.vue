<template>
    <div v-if="isOpen" class="sheet-backdrop" @click.self="close">
        <div v-sheet="close" class="sheet stack" role="dialog" aria-modal="true" :aria-label="t('profile.switchProfile')">
            <ProfileUnlock v-if="gateMember" :key="`gate-${gateMember.id}`" :member="gateMember" :has-back="false" data-testid="personal-gate" @unlocked="openGate" />
            <ProfileUnlock v-else-if="target" :key="target.id" :member="target" @unlocked="enter(target)" @cancel="target = null" />
            <template v-else>
                <h2 class="subtitle">{{ t('profile.who') }}</h2>
                <button
                    v-for="member in members"
                    :key="member.id"
                    type="button"
                    class="card card--tap row"
                    :style="member.id === currentId ? { outline: '3px solid #1E1A3F', outlineOffset: '3px' } : {}"
                    @click="target = member"
                >
                    <AppAvatar :member="member" :size="52" />
                    <div class="grow">
                        <div class="subtitle">{{ member.name }}</div>
                        <div class="muted">{{ roleLabel(member.role) }}</div>
                    </div>
                </button>
                <AppButton variant="secondary" is-block to="/family" @click="close">{{ t('profile.manageFamily') }}</AppButton>
            </template>
        </div>
    </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const isOpen = useState<boolean>('switcher-open', () => false)
const { people: members, load } = useMembers()
const { currentId, current, select } = useCurrentMember()

const personal = usePersonalDevice()

const target = ref<IMember | null>(null)
const gateMember = computed(() => (personal.isPersonal.value && !personal.isReleased.value ? current.value : null))

watch(isOpen, async isNowOpen => {
    if (isNowOpen && current.value?.role === 'relative') {
        await select(null)
        await load()
    }
})

const close = (): void => {
    personal.gateNext.value = null
    isOpen.value = false
    target.value = null
}

const openGate = async (): Promise<void> => {
    personal.release()
    const next = personal.gateNext.value
    if (next) {
        close()
        await navigateTo(next)
    }
}

const enter = async (member: IMember): Promise<void> => {
    close()
    await navigateTo(member.role === 'child' ? '/kid' : '/home')
}

</script>
