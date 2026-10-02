<template>
    <div class="stack">
        <h1 class="title">{{ t('messages.title') }}</h1>
        <AppEmpty v-if="children.length === 0" :title="t('messages.noOneTitle')" :hint="t('messages.addChild')">
            <NuxtLink to="/family/add" class="btn btn--white"><AppIcon name="user-plus" :size="22" />{{ t('family.add.title') }}</NuxtLink>
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
            <NuxtLink
                v-if="isOnline && child.isBirthdaySoon && !child.isWishBlocked"
                :to="`/message/${child.member.id}?kind=birthday`"
                class="btn btn--white btn--block"
            >
                <AppIcon name="party" :size="22" />{{ t('messages.birthdayWish') }}
            </NuxtLink>
            <template v-if="isOnline && child.isBlocked">
                <button type="button" class="btn btn--block" disabled aria-describedby="blocked-reason"><AppIcon name="mic" :size="22" />{{ t('messages.sendHim') }}</button>
                <p id="blocked-reason" class="muted" role="status">{{ t('messages.activeBlocked', { name: child.member.name }) }}</p>
            </template>
            <NuxtLink v-else-if="isOnline" :to="`/message/${child.member.id}`" class="btn btn--block"><AppIcon name="mic" :size="22" />{{ t('messages.sendHim') }}</NuxtLink>
            <button v-else type="button" class="btn btn--block" disabled><AppIcon name="cloud-off" :size="22" />{{ t('messages.needConnection') }}</button>
        </div>
        </div>
    </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const isOnline = useState<boolean>('is-online', () => true)
const { children } = useMembers()
const { currentId } = useCurrentMember()
const { load, startPolling, stopPolling, lastSentTo, hasActiveTo } = useMessages()

const threads = computed(() =>
    children.value.map(member => {
        const sent = currentId.value ? lastSentTo(currentId.value, member.id) : null
        const statusLabel = sent ? (sent.firstListenedAt ? t('messages.status.heard') : t('messages.status.sent')) : t('messages.status.none')
        const senderId = currentId.value ?? ''
        const days = member.birthdayInDays ?? null
        return {
            member,
            isBlocked: hasActiveTo(senderId, member.id, 'NORMAL'),
            isWishBlocked: hasActiveTo(senderId, member.id, 'BIRTHDAY'),
            isBirthdaySoon: days !== null && days <= BIRTHDAY_WISH_WINDOW_DAYS,
            statusLabel,
        }
    }),
)

onMounted(async () => {
    await load()
    startPolling()
})

onBeforeUnmount(stopPolling)
</script>
