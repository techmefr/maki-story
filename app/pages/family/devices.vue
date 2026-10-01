<template>
    <div class="stack narrow">
        <NuxtLink to="/family" class="muted">Retour</NuxtLink>
        <h1 class="title">Appareils</h1>
        <p class="muted">Les appareils qui ouvrent un profil avec l’empreinte ou le visage. Retire un appareil perdu ou prêté.</p>
        <p v-if="devices.length === 0" class="muted">Aucun appareil enregistré.</p>
        <div v-for="device in devices" :key="device.id" class="card row">
            <div class="grow">
                <div class="subtitle">{{ device.memberName }}</div>
                <div class="muted">{{ device.label }}</div>
            </div>
            <button
                type="button"
                class="btn btn--small btn--white"
                :aria-label="`Retirer ${device.label} de ${device.memberName}`"
                @click="revoke(device)"
            >
                Retirer
            </button>
        </div>
        <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
    </div>
</template>

<script setup lang="ts">
const { request } = useApi()

const devices = ref<IDevice[]>([])
const errorMessage = ref('')

const load = async (): Promise<void> => {
    try {
        devices.value = await request<IDevice[]>('/devices')
    } catch (_error) {
        errorMessage.value = 'Impossible de charger les appareils.'
    }
}

const revoke = async (device: IDevice): Promise<void> => {
    errorMessage.value = ''
    try {
        await request(`/devices/${device.id}`, { method: 'DELETE' })
        devices.value = devices.value.filter(item => item.id !== device.id)
    } catch (_error) {
        errorMessage.value = 'Impossible de retirer cet appareil.'
    }
}

onMounted(load)
</script>
