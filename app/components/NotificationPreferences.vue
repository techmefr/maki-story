<template>
    <section class="stack prefs" aria-labelledby="alerts-title" data-testid="notification-preferences">
        <h2 id="alerts-title" class="subtitle">{{ t('alerts.title') }}</h2>
        <p class="muted">{{ t('alerts.hint') }}</p>
        <div v-if="state !== 'unsupported'" class="stack" style="gap: 8px">
            <AppButton is-block class="prefs__action" v-if="state !== 'on'" :disabled="isBusy || state === 'denied'" data-testid="push-enable" @click="enable">
                <AppIcon name="ear" :size="22" motion="wiggle" />{{ t('alerts.enable') }}
            </AppButton>
            <AppButton variant="secondary" is-block class="prefs__action" v-else :disabled="isBusy" data-testid="push-disable" @click="disable">
                <AppIcon name="mute" :size="22" />{{ t('alerts.disable') }}
            </AppButton>
            <p v-if="state === 'denied'" class="muted" role="status">{{ t('alerts.denied') }}</p>
            <p v-else-if="state === 'on'" class="muted" role="status">{{ t('alerts.enabled') }}</p>
        </div>
        <p v-else class="muted" role="status">{{ t('alerts.unsupported') }}</p>
        <ul class="stack prefs__list">
            <li v-for="kind in kinds" :key="kind" class="card stack" style="gap: 8px" :data-testid="`pref-${kind}`">
                <span class="subtitle">{{ t(`alerts.kinds.${kind}`) }}</span>
                <div class="row row--wrap">
                    <button
                        v-for="channel in channels"
                        :key="channel"
                        type="button"
                        class="chip prefs__chip"
                        :class="{ 'chip--on': isOn(kind, channel) }"
                        :aria-pressed="isOn(kind, channel)"
                        :data-testid="`pref-${kind}-${channel}`"
                        @click="toggle(kind, channel)"
                    >
                        <AppIcon :name="isOn(kind, channel) ? 'check' : 'close'" :size="18" />{{ t(`alerts.channels.${channel}`) }}
                    </button>
                </div>
            </li>
        </ul>
    </section>
</template>

<script setup lang="ts">
const { t } = useI18n()
const { state, refresh, enable: enablePush, disable: disablePush, loadPreferences, setPreference } = usePush()

const kinds = NOTIFICATION_KINDS
const channels = PREFERENCE_CHANNELS
const preferences = ref<INotificationPreference[]>([])
const isBusy = ref(false)

const isOn = (kind: NotificationKind, channel: NotificationChannel): boolean => {
    return preferences.value.find(item => item.kind === kind && item.channel === channel)?.isEnabled ?? true
}

const toggle = async (kind: NotificationKind, channel: NotificationChannel): Promise<void> => {
    const next: INotificationPreference = { kind, channel, isEnabled: !isOn(kind, channel) }
    preferences.value = [...preferences.value.filter(item => !(item.kind === kind && item.channel === channel)), next]
    try {
        await setPreference(next)
    } catch (error) {
        console.error('La préférence n a pas pu être enregistrée', error)
        preferences.value = await loadPreferences()
    }
}

const enable = async (): Promise<void> => {
    isBusy.value = true
    try {
        await enablePush()
    } catch (error) {
        console.error('Les notifications n ont pas pu être activées', error)
    } finally {
        isBusy.value = false
    }
}

const disable = async (): Promise<void> => {
    isBusy.value = true
    try {
        await disablePush()
    } finally {
        isBusy.value = false
    }
}

onMounted(async () => {
    await refresh()
    try {
        preferences.value = await loadPreferences()
    } catch (error) {
        console.error('Les préférences n ont pas pu être chargées', error)
    }
})
</script>

<style scoped>
.prefs__list {
    list-style: none;
    padding: 0;
    margin: 0;
}

.prefs__action,
.prefs__chip {
    min-height: 48px;
}
</style>
