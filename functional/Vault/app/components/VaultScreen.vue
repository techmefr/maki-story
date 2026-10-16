<template>
    <div class="stack vault" :class="{ 'vault--kid': variant === 'kid', 'vault--adult': variant === 'adult' && !isChild }">
        <BackLink :to="backPath" />
        <div class="row">
            <h1 class="title grow">{{ title }}</h1>
            <AppBadge data-testid="vault-counter"><AppIcon name="chest" :size="18" />{{ t('kid.treasure.count', { count: formatNumber(count), limit: formatNumber(limit) }) }}</AppBadge>
        </div>
        <AppEmpty
            v-if="isLoaded && items.length === 0"
            kind="treasure"
            :title="isViewingOther ? t('kid.treasure.emptyParent') : t('kid.treasure.empty')"
            :hint="isViewingOther ? t('kid.treasure.emptyParentHint') : t('kid.treasure.emptyHint')"
        />
        <ul class="vault__list">
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
                        <template v-if="canRemove">
                            <AppIconButton v-if="confirmingId !== item.id" icon="trash" tone="coral" :label="t('kid.treasure.remove')" @click="confirmingId = item.id" />
                            <div v-else class="row row--wrap" role="alertdialog" :aria-label="t('kid.treasure.removeTitle')">
                                <span class="vault__ask">{{ t('kid.treasure.removeBody') }}</span>
                                <AppButton variant="destructive" size="sm" icon="trash" @click="confirmRemove(item)">{{ t('kid.treasure.removeConfirm') }}</AppButton>
                                <AppButton variant="tertiary" size="sm" icon="close" @click="confirmingId = null">{{ t('common.cancel') }}</AppButton>
                            </div>
                        </template>
                    </template>
                </AppListRow>
            </li>
        </ul>
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

const confirmRemove = async (item: ITreasure): Promise<void> => {
    confirmingId.value = null
    if (playingId.value === item.id) {
        player.stop()
        playingId.value = null
    }
    await remove(item.id)
}

player.onEnded(() => {
    playingId.value = null
})

onMounted(async () => {
    await ensureLoaded()
    await load(ownerId.value)
    isLoaded.value = true
})

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

.vault__ask {
    min-width: 0;
    overflow-wrap: anywhere;
}
</style>
