<template>
    <nav v-if="items.length > 0" class="status-strip" :aria-label="t('messages.strip.label')">
        <NuxtLink
            v-for="item in items"
            :key="item.member.id"
            :to="`/message/listen/${item.head.id}`"
            class="status-strip__item"
            :style="{ background: memberHex(item.member) }"
            data-status-bubble
        >
            <AppAvatar :member="item.member" :size="48" />
            <span class="status-strip__name">{{ item.member.name }}</span>
            <span class="status-strip__count">{{ formatNumber(item.count) }}</span>
        </NuxtLink>
    </nav>
</template>

<script setup lang="ts">
const { t, formatNumber } = useI18n()
const { currentId } = useCurrentMember()
const { grownUps } = useMembers()
const { queueFrom } = useMessages()

const items = computed(() =>
    grownUps.value.flatMap(member => {
        const queue = currentId.value ? queueFrom(member.id, currentId.value) : []
        const head = queue[0]
        if (!head) {
            return []
        }
        return [{ member, head, count: queue.length }]
    }),
)
</script>

<style scoped>
.status-strip {
    display: none;
    position: sticky;
    top: 0;
    z-index: 5;
    gap: 12px;
    overflow-x: auto;
    padding: 8px 4px 12px;
    background: var(--bg);
}

.status-strip__item {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    border: 2.5px solid var(--ink);
    border-radius: 999px;
    padding-block: 6px;
    padding-inline: 8px 18px;
    color: var(--ink);
    text-decoration: none;
    box-shadow: var(--shadow);
    font: 700 1.125rem/1 var(--font-title);
    min-height: 64px;
}

.status-strip__count {
    min-width: 30px;
    height: 30px;
    border-radius: 999px;
    border: 2.5px solid var(--ink);
    background: var(--paper);
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

@media (min-width: 768px) {
    .status-strip {
        display: flex;
    }
}
</style>
