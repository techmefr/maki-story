<template>
    <div class="stack narrow">
        <NuxtLink to="/family" class="link-back"><AppIcon name="back" :size="18" class="mirror-rtl" />{{ t('common.back') }}</NuxtLink>
        <h1 class="title">{{ t('family.devices.title') }}</h1>
        <p class="muted">{{ t('family.devices.intro') }}</p>
        <AppEmpty kind="people" v-if="devices.length === 0" :title="t('family.devices.empty')" :hint="t('family.devices.emptyHint')" />
        <div v-for="device in devices" :key="device.id" class="card row">
            <div class="grow">
                <div class="subtitle">{{ device.memberName }}</div>
                <div class="muted">{{ device.label }}</div>
            </div>
            <AppButton variant="secondary" size="sm"
                :aria-label="t('family.devices.revokeLabel', { device: device.label, member: device.memberName })"
                @click="revoke(device)">
                {{ t('family.devices.revoke') }}
            </AppButton>
        </div>
        <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
    </div>
</template>

<script setup lang="ts">
const { request } = useApi()
const { t } = useI18n()

const devices = ref<IDevice[]>([])
const errorMessage = ref('')

const load = async (): Promise<void> => {
    try {
        devices.value = await request<IDevice[]>('/devices')
    } catch (_error) {
        errorMessage.value = t('family.devices.loadError')
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
