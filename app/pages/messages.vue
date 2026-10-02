<template>
    <div class="stack">
        <h1 class="title">{{ t('messages.title') }}</h1>
        <AppEmpty kind="messages" v-if="children.length === 0" :title="t('messages.noOneTitle')" :hint="t('messages.addChild')">
            <AppButton variant="secondary" to="/family/add"><AppIcon name="user-plus" :size="22" />{{ t('family.add.title') }}</AppButton>
        </AppEmpty>
        <div class="grid grid--people">
        <div v-for="child in threads" :key="child.member.id" class="card stack">
            <div class="row">
                <AppAvatar :member="child.member" :size="52" />
                <div class="grow">
                    <div class="subtitle">{{ child.member.name }}</div>
                    <div class="muted">{{ child.statusLabel }}</div>
                </div>
            </div>
            <AppButton v-if="isOnline && child.isBlocked" is-block disabled :disabled-reason="t('messages.activeBlocked', { name: child.member.name })"><AppIcon name="mic" :size="22" />{{ t('messages.sendHim') }}</AppButton>
            <AppButton v-else-if="isOnline" is-block :to="`/message/${child.member.id}`"><AppIcon name="mic" :size="22" />{{ t('messages.sendHim') }}</AppButton>
            <AppButton v-else is-block disabled><AppIcon name="cloud-off" :size="22" />{{ t('messages.needConnection') }}</AppButton>
        </div>
        </div>
    </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const isOnline = useState<boolean>('is-online', () => true)
const { children } = useMembers()
const { currentId } = useCurrentMember()
const { load, startPolling, stopPolling, lastSentTo } = useMessages()

const threads = computed(() =>
    children.value.map(member => {
        const sent = currentId.value ? lastSentTo(currentId.value, member.id) : null
        const statusLabel = sent ? (sent.firstListenedAt ? t('messages.status.heard') : t('messages.status.sent')) : t('messages.status.none')
        return { member, isBlocked: sent !== null, statusLabel }
    }),
)

onMounted(async () => {
    await load()
    startPolling()
})

onBeforeUnmount(stopPolling)
</script>
