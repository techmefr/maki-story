<template>
    <section class="kids" :aria-label="t('homeBar.label')">
        <ul class="kids__list" role="list" data-testid="home-kid-cards">
            <li v-if="kids.length >= 2" class="kids__item">
                <NuxtLink
                    :to="`/message/${ALL_RECIPIENTS_ID}`"
                    class="kid kid--all"
                    :aria-label="t('homeCards.openAll')"
                    data-testid="home-kid-all"
                >
                    <span class="kid__photo kid__photo--all"><AppIcon name="users" :size="64" /></span>
                    <span class="kid__name">{{ t('homeBar.all') }}</span>
                    <span class="kid__quota"><AppIcon name="mic" :size="16" />{{ t('homeCards.everyone') }}</span>
                </NuxtLink>
            </li>
            <li v-for="card in cards" :key="card.member.id" class="kids__item">
                <NuxtLink
                    :to="`/message/${card.member.id}`"
                    class="kid"
                    :style="{ '--ring': card.ring }"
                    :aria-label="t('homeCards.open', { name: card.member.name })"
                    :data-testid="`home-kid-${card.member.id}`"
                >
                    <span class="kid__photo"><AppAvatar :member="card.member" :size="96" /></span>
                    <span class="kid__name">{{ card.member.name }}</span>
                    <span class="kid__quota"><AppIcon name="mic" :size="16" />{{ t('homeBar.quota', { count: card.count, max: MESSAGE_MAX_ACTIVE }) }}</span>
                </NuxtLink>
                <NuxtLink
                    v-if="card.message && card.unheard > 0"
                    :to="`/message/listen/${card.message.id}`"
                    class="kid__bubble"
                    :class="{ 'kid__bubble--birthday': card.message.kind === 'BIRTHDAY' }"
                    :style="{ background: card.ring }"
                    :aria-label="t('homeCards.bubbleLabel', { name: card.member.name, count: card.unheard })"
                    :data-testid="`home-bubble-${card.member.id}`"
                >
                    <AppIcon :name="card.message.kind === 'BIRTHDAY' ? 'party' : 'message-heart'" :size="22" motion="wiggle" />
                    {{ t('homeCards.bubble') }}
                    <span class="kid__count" data-bubble-count>{{ card.unheard }}</span>
                </NuxtLink>
            </li>
        </ul>
    </section>
</template>

<script setup lang="ts">
const props = defineProps<{ kids: IMember[]; counts: Record<string, number> }>()

const { t } = useI18n()
const { currentId } = useCurrentMember()
const { playableFrom, unreadFrom } = useMessages()

const cards = computed(() =>
    props.kids.map(member => ({
        member,
        ring: memberHex(member),
        count: props.counts[member.id] ?? 0,
        message: currentId.value ? playableFrom(member.id, currentId.value) : null,
        unheard: currentId.value ? unreadFrom(member.id, currentId.value) : 0,
    })),
)
</script>

<style scoped>
.kids__list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px 14px;
    margin: 0;
    padding: 8px 0;
    list-style: none;
}

@media (min-width: 720px) {
    .kids__list {
        grid-template-columns: repeat(4, minmax(0, 1fr));
    }
}

.kids__item {
    position: relative;
    display: flex;
}

.kid {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    min-height: 48px;
    padding: 16px 8px;
    border: var(--outline) solid var(--ink);
    border-radius: 22px;
    background: var(--paper);
    box-shadow: var(--shadow);
    color: var(--ink);
    text-align: center;
    text-decoration: none;
}

.kid:focus-visible {
    outline: 4px solid var(--ink);
    outline-offset: 3px;
}

.kid__photo {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 5px;
    border: 5px solid var(--ring);
    border-radius: 50%;
}

.kid__photo--all {
    width: 116px;
    height: 116px;
    border-color: var(--sky);
    color: var(--ink);
}

.kid__name {
    max-width: 100%;
    overflow-wrap: anywhere;
    font: 800 1.25rem/1.2 var(--font-title);
}

.kid__quota {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: var(--ink-soft);
    font: 600 0.9375rem/1.2 var(--font-body);
}

.kid__bubble {
    position: absolute;
    top: -8px;
    inset-inline-end: 6px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 48px;
    padding: 8px 14px;
    border: 2.5px solid var(--ink);
    border-radius: 999px;
    box-shadow: var(--shadow);
    color: var(--ink);
    font: 700 0.9375rem/1 var(--font-title);
    text-decoration: none;
}

.kid__bubble:focus-visible {
    outline: 4px solid var(--ink);
    outline-offset: 3px;
}

.kid__bubble--birthday {
    outline: 3px dashed var(--ink);
    outline-offset: 2px;
}

.kid__count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 26px;
    height: 26px;
    border: 2.5px solid var(--ink);
    border-radius: 999px;
    background: var(--paper);
    font-size: 0.875rem;
}
</style>
