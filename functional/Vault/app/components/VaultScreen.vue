<template>
    <div class="stack vault" :class="{ 'vault--kid': variant === 'kid', 'vault--adult': variant === 'adult' && !isChild }">
        <BackLink :to="backPath" />
        <MakiScene v-if="variant === 'kid'" pose="heart" :size="112" />
        <div class="row row--wrap">
            <h1 class="title grow">{{ title }}</h1>
            <AppBadge data-testid="vault-counter"><AppIcon name="chest" :size="18" />{{ t('kid.treasure.count', { count: formatNumber(count), limit: formatNumber(limit) }) }}</AppBadge>
        </div>
        <AppEmpty
            v-if="isLoaded && items.length === 0"
            kind="treasure"
            :title="isViewingOther ? t('kid.treasure.emptyParent') : t('kid.treasure.empty')"
            :hint="isViewingOther ? t('kid.treasure.emptyParentHint') : t('kid.treasure.emptyHint')"
        />
        <p v-if="count >= limit" class="vault__notice" role="status">{{ t('kid.treasure.fullHint') }}</p>
        <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
        <AppButton v-if="!isLoaded" variant="secondary" icon="redo" :disabled="isBusy" @click="refresh">{{ t('common.retry') }}</AppButton>
        <ul class="vault__list" :aria-busy="isBusy">
            <li v-for="item in items" :key="item.id" data-testid="vault-item">
                <AppListRow :title="t('kid.treasure.from', { name: senderOf(item)?.name ?? '' })" :subtitle="subtitleOf(item)">
                    <template #lead><AppAvatar v-if="senderOf(item)" :member="senderOf(item)!" :size="avatarSize" /></template>
                    <template #action>
                        <AppIconButton
                            icon="play"
                            :label="t('kid.treasure.play', { name: senderOf(item)?.name ?? '' })"
                            :disabled="playingId === item.id && isPlaying"
                            @click="play(item)"
                        />
                        <AppIconButton v-if="canRemove" icon="trash" tone="coral" :label="t('kid.treasure.remove')" @click="confirmingId = item.id" />
                    </template>
                </AppListRow>
            </li>
        </ul>
        <AppBottomSheet :open="confirmingId !== null" :title="t('kid.treasure.removeTitle')" @close="closeConfirmation">
            <p>{{ t('kid.treasure.removeBody') }}</p>
            <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
            <AppButton variant="destructive" icon="trash" :disabled="isBusy" @click="confirmRemove">{{ t('kid.treasure.removeConfirm') }}</AppButton>
            <AppButton variant="secondary" icon="close" :disabled="isBusy" @click="closeConfirmation">{{ t('common.cancel') }}</AppButton>
        </AppBottomSheet>
    </div>
</template>

<script setup lang="ts">
const SECONDS_PER_MS = 1000
const KID_AVATAR_SIZE = 56
const ADULT_AVATAR_SIZE = 48

const props = withDefaults(defineProps<{ variant?: 'kid' | 'adult' }>(), { variant: 'adult' })

const { t, formatDate, formatNumber } = useI18n()
const route = useRoute()
const { getById, ensureLoaded } = useMembers()
const { isChild } = useCurrentMember()
const { items, limit, count, load, remove } = useTreasure()
const player = useAudioPlayer()
const { isRelativeAccount } = useSession()

const isLoaded = ref(false)
const isBusy = ref(false)
const errorMessage = ref('')
const confirmingId = ref<string | null>(null)
const playingId = ref<string | null>(null)

const ownerId = computed<string | undefined>(() => (typeof route.query.child === 'string' ? route.query.child : undefined))
const owner = computed<IMember | null>(() => getById(ownerId.value ?? null))
const isViewingOther = computed<boolean>(() => owner.value !== null)
const isPlaying = computed<boolean>(() => player.isPlaying.value)
const canRemove = computed<boolean>(() => !isChild.value)
const avatarSize = computed<number>(() => (props.variant === 'kid' ? KID_AVATAR_SIZE : ADULT_AVATAR_SIZE))
const title = computed<string>(() => (owner.value ? t('kid.treasure.titleOf', { name: owner.value.name }) : t('vault.title')))
const backPath = computed<string>(() => {
    if (isChild.value) {
        return '/kid'
    }
    if (isViewingOther.value) {
        return '/family'
    }
    return isRelativeAccount.value ? '/relative' : '/home'
})

const senderOf = (item: ITreasure): IMember | null => getById(item.fromMemberId)

const subtitleOf = (item: ITreasure): string => `${formatDate(item.createdAt)} · ${t('vault.seconds', { count: Math.max(1, Math.round(item.durationMs / SECONDS_PER_MS)) })}`

const play = async (item: ITreasure): Promise<void> => {
    if (playingId.value === item.id) {
        await player.resume()
        return
    }
    player.unlock()
    playingId.value = item.id
    await player.play(item.fileId)
}

const closeConfirmation = (): void => {
    if (!isBusy.value) {
        confirmingId.value = null
    }
}

const confirmRemove = async (): Promise<void> => {
    const id = confirmingId.value
    if (!id || isBusy.value) {
        return
    }
    isBusy.value = true
    errorMessage.value = ''
    try {
        if (playingId.value === id) {
            player.stop()
            playingId.value = null
        }
        await remove(id)
        confirmingId.value = null
    } catch (error) {
        errorMessage.value = errorText(error, 'common.unknownError')
    } finally {
        isBusy.value = false
    }
}

const refresh = async (): Promise<void> => {
    isBusy.value = true
    errorMessage.value = ''
    try {
        await ensureLoaded()
        isLoaded.value = await load(ownerId.value)
        if (!isLoaded.value) {
            errorMessage.value = t('common.unknownError')
        }
    } finally {
        isBusy.value = false
    }
}

player.onEnded(() => {
    playingId.value = null
})

onMounted(refresh)

onBeforeUnmount(() => player.stop())
</script>

<style scoped>
.vault--kid {
    gap: 24px;
}

.vault--kid .vault__list {
    gap: 20px;
}

@media (min-width: 1024px) {
    .vault--kid .vault__list {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .vault--kid .vault__list > li {
        min-width: 0;
    }
}

.vault--adult {
    gap: 24px;
}

.vault--adult .vault__list {
    gap: 20px;
}

@media (min-width: 1100px) {
    .vault--adult .vault__list {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        align-items: start;
    }

    .vault--adult .vault__list > li {
        min-width: 0;
    }
}

.vault__list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin: 0;
    padding: 0;
    list-style: none;
}

.vault__notice {
    margin: 0;
    padding: 16px;
    border: var(--outline) dashed var(--ink);
    border-radius: 24px;
    background: var(--yellow);
    color: var(--on-accent);
}

.vault__ask {
    min-width: 0;
    overflow-wrap: anywhere;
}
</style>
