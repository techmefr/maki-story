<template>
    <div class="stack narrow">
        <div class="row">
            <BackLink to="/family" />
            <h1 class="title grow">{{ t('family.devices.title') }}</h1>
        </div>
        <p class="devices__hint">{{ t('family.devices.intro') }}</p>
        <AppEmpty v-if="isLoaded && devices.length === 0" kind="people" :title="t('family.devices.empty')" :hint="t('family.devices.emptyHint')" />
        <section v-for="group in groups" :key="group.memberId" class="stack devices__group" :aria-labelledby="`devices-${group.memberId}`">
            <h2 :id="`devices-${group.memberId}`" class="subtitle">{{ group.memberName }}</h2>
            <ul class="devices__list">
                <li v-for="device in group.devices" :key="device.id" data-testid="device-row">
                    <AppListRow :title="device.label" :subtitle="lastUsed(device)">
                        <template #lead><span class="devices__icon"><AppIcon name="settings" :size="22" /></span></template>
                        <template #action>
                            <AppIconButton
                                icon="logout"
                                tone="coral"
                                :label="t('family.devices.revokeLabel', { device: device.label, member: device.memberName })"
                                @click="pending = device"
                            />
                        </template>
                    </AppListRow>
                </li>
            </ul>
        </section>
        <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
        <AppBottomSheet :open="pending !== null" :title="t('family.devices.confirmTitle', { device: pending?.label ?? '', member: pending?.memberName ?? '' })" @close="pending = null">
            <div class="row">
                <AppButton variant="secondary" class="grow" @click="pending = null">{{ t('common.cancel') }}</AppButton>
                <AppButton class="grow" icon="logout" data-testid="device-revoke-confirm" @click="confirmRevoke">{{ t('family.devices.revoke') }}</AppButton>
            </div>
        </AppBottomSheet>
    </div>
</template>

<script setup lang="ts">
const { request } = useApi()
const { t, formatDate } = useI18n()

const devices = ref<IDevice[]>([])
const isLoaded = ref(false)
const pending = ref<IDevice | null>(null)

const groups = computed(() => {
    const byMember = new Map<string, { memberId: string; memberName: string; devices: IDevice[] }>()
    for (const device of devices.value) {
        const entry = byMember.get(device.memberId) ?? { memberId: device.memberId, memberName: device.memberName, devices: [] }
        entry.devices.push(device)
        byMember.set(device.memberId, entry)
    }
    return [...byMember.values()]
})

const lastUsed = (device: IDevice): string =>
    device.lastUsedAt ? t('family.devices.lastUsed', { date: formatDate(device.lastUsedAt, { dateStyle: 'medium' }) }) : t('family.devices.neverUsed')

const confirmRevoke = async (): Promise<void> => {
    const target = pending.value
    pending.value = null
    if (target) {
        await revoke(target)
    }
}
const errorMessage = ref('')

const load = async (): Promise<void> => {
    try {
        devices.value = await request<IDevice[]>('/devices')
    } catch (_error) {
        errorMessage.value = t('family.devices.loadError')
    } finally {
        isLoaded.value = true
    }
}

const revoke = async (device: IDevice): Promise<void> => {
    errorMessage.value = ''
    try {
        await request(`/devices/${device.id}`, { method: 'DELETE' })
        devices.value = devices.value.filter(item => item.id !== device.id)
    } catch (_error) {
        errorMessage.value = t('family.devices.revokeError')
    }
}

onMounted(load)
</script>

<style scoped>
.devices__hint {
    margin: 0;
    color: var(--ink-soft);
    font: 600 1rem/1.3 var(--font-body);
}

.devices__group {
    gap: 10px;
}

.devices__list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin: 0;
    padding: 0;
    list-style: none;
}

.devices__icon {
    display: flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border: var(--outline) solid var(--ink);
    border-radius: 50%;
    background: var(--sky);
    color: var(--on-accent);
}
</style>
