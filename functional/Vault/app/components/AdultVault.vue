<template>
    <div class="stack vault">
        <div class="row">
            <BackLink :to="backPath" />
            <h1 class="title grow">{{ t('vault.title') }}</h1>
            <AppBadge data-testid="vault-counter">{{ t('vault.count', { count: items.length, limit }) }}</AppBadge>
        </div>
        <AppEmpty v-if="isLoaded && items.length === 0" kind="treasure" :title="t('vault.emptyTitle')" :hint="t('vault.emptyHint')" />
        <ul class="vault__list">
            <li v-for="item in items" :key="item.id" data-testid="vault-item">
                <AppListRow :title="t('kid.treasure.from', { name: senderOf(item)?.name ?? '' })" :subtitle="subtitleOf(item)">
                    <template #lead><AppAvatar v-if="senderOf(item)" :member="senderOf(item)!" :size="48" /></template>
                    <template #action>
                        <AppIconButton
                            icon="play"
                            :label="t('kid.treasure.play', { name: senderOf(item)?.name ?? '' })"
                            :disabled="playingId === item.id && isPlaying"
                            @click="play(item)"
                        />
                        <AppIconButton icon="trash" tone="coral" :label="t('vault.remove')" @click="remove(item.id)" />
                    </template>
                </AppListRow>
            </li>
        </ul>
    </div>
</template>

<script setup lang="ts">
const SECONDS_PER_MS = 1000

const { t, formatDate } = useI18n()
const { getById, ensureLoaded } = useMembers()
const { items, limit, load, remove } = useTreasure()
const player = useAudioPlayer()
const { isRelativeAccount } = useSession()

const isLoaded = ref(false)
const playingId = ref<string | null>(null)

const isPlaying = computed<boolean>(() => player.isPlaying.value)
const backPath = computed<string>(() => (isRelativeAccount.value ? '/relative' : '/home'))

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

player.onEnded(() => {
    playingId.value = null
})

onMounted(async () => {
    await ensureLoaded()
    await load()
    isLoaded.value = true
})

onBeforeUnmount(() => player.stop())
</script>

<style scoped>
.vault__list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin: 0;
    padding: 0;
    list-style: none;
}
</style>
