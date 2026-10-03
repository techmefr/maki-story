<template>
    <div class="heart" data-testid="treasure-heart">
        <button
            type="button"
            class="heart__button"
            :class="{ 'heart__button--filled': isSaved, 'heart__button--filling': isFilling }"
            :disabled="isSaved || isFull"
            :aria-pressed="isSaved"
            :aria-label="label"
            @click="save"
        >
            <AppIcon name="heart" :size="40" motion="none" />
            <span v-if="isBursting" class="heart__confetti" aria-hidden="true" data-testid="heart-confetti">
                <span v-for="index in PIECES" :key="index" class="heart__piece" :style="{ '--i': index }" />
            </span>
        </button>
        <small class="heart__count" data-testid="treasure-count">{{ t('kid.treasure.count', { count: formatNumber(count), limit: formatNumber(limit) }) }}</small>
        <small v-if="isFull && !isSaved" class="heart__reason" role="status">{{ t('errors.server.treasureFull') }}</small>
        <small v-else-if="errorMessage" class="heart__reason" role="alert">{{ errorMessage }}</small>
    </div>
</template>

<script setup lang="ts">
const PIECES = 10
const FILL_MS = 350
const BURST_MS = 1100

const props = defineProps<{ messageId: string; childId: string }>()

const { t, formatNumber } = useI18n()
const { limit, count, isFull, load, save: saveMemory, hasMessage } = useTreasure()
const { play } = useSoundCues()
const { current } = useCurrentMember()

const isFilling = ref(false)
const isBursting = ref(false)
const errorMessage = ref('')

const isSaved = computed(() => hasMessage(props.messageId))
const label = computed(() => (isSaved.value ? t('kid.treasure.saved') : t('kid.treasure.save')))

const save = async (): Promise<void> => {
    errorMessage.value = ''
    try {
        await saveMemory(props.messageId)
    } catch (error) {
        console.error('Le message n a pas pu être gardé', error)
        errorMessage.value = t('errors.server.treasureFull')
        await load(childFilter())
        return
    }
    isFilling.value = true
    setTimeout(() => {
        isFilling.value = false
        isBursting.value = true
        play('success')
        setTimeout(() => {
            isBursting.value = false
        }, BURST_MS)
    }, FILL_MS)
}

const childFilter = (): string | undefined => (current.value?.role === 'child' ? undefined : props.childId)

onMounted(() => load(childFilter()))
</script>

<style scoped>
.heart {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
}

.heart__button {
    position: relative;
    min-width: var(--tap, 48px);
    min-height: var(--tap, 48px);
    padding: 12px;
    border: 3px solid var(--ink);
    border-radius: 50%;
    background: var(--paper);
    color: var(--ink);
    box-shadow: 3px 3px 0 var(--ink);
    cursor: pointer;
}

.heart__button:disabled {
    cursor: default;
}

.heart__button:not(:disabled):active {
    transform: translate(3px, 3px);
    box-shadow: 0 0 0 var(--ink);
}

.heart__button--filled,
.heart__button--filling {
    background: #ff94c8;
}

.heart__button--filled :deep(svg),
.heart__button--filling :deep(svg) {
    fill: currentColor;
}

.heart__button--filling :deep(svg) {
    animation: heart-fill 0.35s ease-out;
}

.heart__confetti {
    position: absolute;
    inset: 50% auto auto 50%;
    pointer-events: none;
}

.heart__piece {
    position: absolute;
    width: 14px;
    height: 14px;
    background: #ff5fa8;
    clip-path: path('M7 13 C-4 5 2 -2 7 3 C12 -2 18 5 7 13 Z');
    animation: heart-burst 1s ease-out forwards;
    --angle: calc(var(--i) * 36deg);
}

.heart__count {
    font: 700 0.875rem/1.2 var(--font-title);
}

.heart__reason {
    max-width: 18rem;
    text-align: center;
    overflow-wrap: anywhere;
}

@keyframes heart-fill {
    from {
        transform: scale(0.6);
    }
    60% {
        transform: scale(1.25);
    }
    to {
        transform: scale(1);
    }
}

@keyframes heart-burst {
    from {
        opacity: 1;
        transform: rotate(var(--angle)) translateY(0) scale(0.6);
    }
    to {
        opacity: 0;
        transform: rotate(var(--angle)) translateY(-90px) scale(1.2);
    }
}

@media (prefers-reduced-motion: reduce) {
    .heart__button--filling :deep(svg) {
        animation: none;
    }

    .heart__piece {
        display: none;
    }
}
</style>
