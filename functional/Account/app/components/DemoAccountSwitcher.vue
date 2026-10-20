<template>
    <aside v-if="profiles.length" class="demo-switcher" :aria-label="t('auth.demo.title')">
        <label for="demo-profile">{{ t('auth.demo.title') }}</label>
        <select id="demo-profile" v-model="selected" class="input" :disabled="busy">
            <option disabled value="">{{ t('auth.demo.choose') }}</option>
            <option v-for="profile in profiles" :key="profile.id" :value="profile.id">{{ profile.name }} · {{ t(`auth.demo.${profile.role}`) }}</option>
        </select>
        <AppButton :disabled="!selected || busy" @click="open">{{ t('auth.demo.open') }}</AppButton>
        <p v-if="failed" role="alert">{{ t('auth.demo.failed') }}</p>
    </aside>
</template>

<script setup lang="ts">
const { t } = useI18n()
const profiles = ref<{ id: string; name: string; role: string }[]>([])
const selected = ref('')
const busy = ref(false)
const failed = ref(false)
onMounted(async () => {
    try {
        profiles.value = await $fetch('/api/auth/demo')
    } catch {
        profiles.value = []
    }
})
const open = async (): Promise<void> => {
    busy.value = true
    failed.value = false
    try {
        const result = await $fetch<{ path: string }>('/api/auth/demo', { method: 'POST', body: { id: selected.value } })
        await clearOfflineData()
        markProfileUnlocked()
        reloadNuxtApp({ path: result.path, persistState: false, force: true })
    } catch {
        failed.value = true
        busy.value = false
    }
}
</script>

<style scoped>
.demo-switcher { position: relative; z-index: 21; display: flex; flex-wrap: wrap; align-items: center; gap: 12px; padding: 12px 20px; background: #fff0bd; color: #271b43; border-bottom: 2px solid #271b43; }
.demo-switcher label { font-weight: 700; }
.demo-switcher select { width: min(100%, 380px); flex: 1 1 200px; min-width: 0; }
.demo-switcher p { width: 100%; }
</style>
