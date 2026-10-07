<template>
    <div class="stack narrow">
        <div class="row">
            <BackLink :to="backPath" />
            <span class="grow" />
            <AppButton v-if="unreadCount > 0" variant="secondary" size="sm" icon="check" data-testid="notifications-mark-all" @click="markRead()">{{ t('notifications.markAllRead') }}</AppButton>
        </div>
        <h1 class="title">{{ t('notifications.title') }}</h1>
        <AppEmpty v-if="items.length === 0" kind="notifications" :title="t('notifications.allRead')" :hint="t('notifications.empty')" />
        <ul class="list">
            <li v-for="item in items" :key="item.id">
                <button type="button" class="note" :class="{ 'note--unread': !item.isRead }" :data-testid="`notification-${item.id}`" @click="open(item)">
                    <span class="note__initial" :style="{ background: pickVoiceByText(item.id).hex }" aria-hidden="true">{{ initialOf(item) }}</span>
                    <span class="note__body">
                        <span class="note__title">{{ t(item.kind === 'homework_request' ? 'homework.notificationTitle' : `notifications.titles.${item.kind}`) }}</span>
                        <span class="note__text">{{ describeNotification(item, t) }}</span>
                    </span>
                    <span class="note__side">
                        <span class="note__time">{{ timeLabel(item.updatedAt) }}</span>
                        <AppBadge v-if="!item.isRead">{{ t('notifications.new') }}</AppBadge>
                    </span>
                </button>
            </li>
        </ul>
        <AppButton is-block icon="send" to="/sharing">{{ t('notifications.sharing') }}</AppButton>
        <HomeworkRequests v-if="current?.role === 'parent'" />
    </div>
</template>

<script setup lang="ts">
const { t, formatDate } = useI18n()
const { isRelativeAccount } = useSession()
const { current } = useCurrentMember()
const { items, unreadCount, load, markRead } = useNotifications()

const MINUTE_MS = 60000
const HOUR_MS = 3600000
const DAY_MS = 86400000

const open = async (item: INotification): Promise<void> => {
    await markRead([item.id])
    const target = notificationTarget(item, current.value?.role)
    if (target) {
        await navigateTo(target)
    }
}

const backPath = computed<string>(() => (isRelativeAccount.value ? '/relative' : '/home'))

const initialOf = (item: INotification): string => notificationActor(item).charAt(0).toUpperCase()

const timeLabel = (iso: string): string => {
    const elapsed = Date.now() - new Date(iso).getTime()
    if (elapsed < HOUR_MS) {
        return t('notifications.minutes', { count: Math.max(1, Math.round(elapsed / MINUTE_MS)) })
    }
    if (elapsed < DAY_MS) {
        return t('notifications.hours', { count: Math.round(elapsed / HOUR_MS) })
    }
    return formatDate(iso, { day: 'numeric', month: 'short' })
}

onMounted(load)
</script>

<style scoped>
.list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin: 0;
    padding: 0;
    list-style: none;
}

.note {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    min-height: var(--tap);
    padding: 12px 14px;
    border: var(--outline) solid var(--ink);
    border-radius: 22px;
    background: var(--paper);
    box-shadow: var(--shadow);
    color: var(--ink);
    text-align: start;
    cursor: pointer;
}

.note--unread {
    background: var(--yellow);
    color: var(--on-accent);
}

.note__initial {
    display: flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border: var(--outline) solid var(--ink);
    border-radius: 50%;
    color: var(--on-accent);
    font: 700 1.125rem/1 var(--font-title);
}

.note__body {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
}

.note__title {
    font: 700 1.0625rem/1.2 var(--font-title);
}

.note__text {
    font: 600 0.9375rem/1.3 var(--font-body);
    overflow-wrap: anywhere;
}

.note__side {
    display: flex;
    flex: none;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
}

.note__time {
    font: 600 0.875rem/1 var(--font-body);
}
</style>
