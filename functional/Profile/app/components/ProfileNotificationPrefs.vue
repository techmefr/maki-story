<template>
    <ul class="npref" role="list" data-testid="menu-notifications">
        <li v-for="kind in kinds" :key="kind" class="npref__item" :data-testid="`pref-${kind}`">
            <span class="npref__label">{{ t(`alerts.kinds.${kind}`) }}</span>
            <div class="row row--wrap" role="group" :aria-label="t(`alerts.kinds.${kind}`)">
                <ProfileChip
                    v-for="channel in channels"
                    :key="channel"
                    is-small
                    :selected="isOn(kind, channel)"
                    :data-testid="`pref-${kind}-${channel}`"
                    @click="toggle(kind, channel)"
                >
                    {{ t(`alerts.channels.${channel}`) }}
                </ProfileChip>
            </div>
        </li>
    </ul>
</template>

<script setup lang="ts">
const { t } = useI18n()
const { loadPreferences, setPreference } = usePush()

const kinds = NOTIFICATION_KINDS
const channels = PREFERENCE_CHANNELS
const preferences = ref<INotificationPreference[]>([])

const isOn = (kind: NotificationKind, channel: NotificationChannel): boolean => {
    return preferences.value.find(item => item.kind === kind && item.channel === channel)?.isEnabled ?? true
}

const toggle = async (kind: NotificationKind, channel: NotificationChannel): Promise<void> => {
    const next: INotificationPreference = { kind, channel, isEnabled: !isOn(kind, channel) }
    preferences.value = [...preferences.value.filter(item => !(item.kind === kind && item.channel === channel)), next]
    try {
        await setPreference(next)
    } catch (_error) {
        preferences.value = await loadPreferences()
    }
}

onMounted(async () => {
    try {
        preferences.value = await loadPreferences()
    } catch (_error) {
        preferences.value = []
    }
})
</script>

<style scoped>
.npref {
    display: flex;
    flex-direction: column;
    gap: 14px;
    margin: 0;
    padding: 0;
    list-style: none;
}

.npref__item {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.npref__label {
    font: 700 1rem/1.2 var(--font-title);
}
</style>
