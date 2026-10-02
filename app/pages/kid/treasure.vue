<template>
    <div class="stack narrow">
        <div class="row">
            <AppButton variant="secondary" is-round :to="backPath" :aria-label="t('common.back')"><AppIcon name="back" :size="26" class="mirror-rtl" /></AppButton>
            <h1 class="title grow">{{ title }}</h1>
        </div>
        <div class="badge treasure__count" data-testid="treasure-counter">
            <AppIcon name="chest" :size="22" />
            {{ t('kid.treasure.count', { count: formatNumber(count), limit: formatNumber(limit) }) }}
        </div>
        <AppEmpty
            v-if="isLoaded && items.length === 0"
            kind="treasure"
            :title="isParent ? t('kid.treasure.emptyParent') : t('kid.treasure.empty')"
            :hint="isParent ? t('kid.treasure.emptyParentHint') : t('kid.treasure.emptyHint')"
        />
        <ul class="stack treasure__list">
            <li v-for="item in items" :key="item.id" class="card row treasure__item" data-testid="treasure-item">
                <AppAvatar v-if="senderOf(item)" :member="senderOf(item)!" :size="56" />
                <span class="subtitle grow treasure__name">{{ t('kid.treasure.from', { name: senderOf(item)?.name ?? '' }) }}</span>
                <AppButton
                    variant="secondary"
                    is-round
                    :aria-label="t('kid.treasure.play', { name: senderOf(item)?.name ?? '' })"
                    :aria-pressed="playingId === item.id"
                    @click="toggle(item)"
                >
                    <AppIcon :name="playingId === item.id && isPlaying ? 'pause' : 'play'" :size="30" />
                </AppButton>
                <template v-if="isParent">
                    <AppButton
                        v-if="confirmingId !== item.id"
                        variant="secondary"
                        is-round
                        :aria-label="t('kid.treasure.remove')"
                        @click="confirmingId = item.id"
                    >
                        <AppIcon name="trash" :size="26" />
                    </AppButton>
                    <div v-else class="row row--wrap" role="alertdialog" :aria-label="t('kid.treasure.removeTitle')">
                        <span class="treasure__ask">{{ t('kid.treasure.removeBody') }}</span>
                        <AppButton variant="destructive" size="sm" icon="trash" @click="confirmRemove(item)">{{ t('kid.treasure.removeConfirm') }}</AppButton>
                        <AppButton variant="tertiary" size="sm" icon="close" @click="confirmingId = null">{{ t('common.cancel') }}</AppButton>
                    </div>
                </template>
            </li>
        </ul>
    </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'kid' })

const { t, formatNumber } = useI18n()
const route = useRoute()
const { getById, ensureLoaded } = useMembers()
const { isParent } = useCurrentMember()
const { items, limit, count, load, remove } = useTreasure()
const player = useAudioPlayer()

const isLoaded = ref(false)
const confirmingId = ref<string | null>(null)
const playingId = ref<string | null>(null)

const childId = computed(() => (typeof route.query.child === 'string' ? route.query.child : undefined))
const owner = computed(() => getById(childId.value ?? null))
const isPlaying = computed(() => player.isPlaying.value)
const backPath = computed(() => (isParent.value ? '/family' : '/kid'))
const title = computed(() => (owner.value ? t('kid.treasure.titleOf', { name: owner.value.name }) : t('kid.treasure.title')))

const senderOf = (item: ITreasure): IMember | null => getById(item.fromMemberId)

const toggle = async (item: ITreasure): Promise<void> => {
    if (playingId.value === item.id) {
        if (isPlaying.value) {
            player.pause()
        } else {
            await player.resume()
        }
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
    await load(childId.value)
    isLoaded.value = true
})

onBeforeUnmount(() => player.stop())
</script>

<style scoped>
.treasure__list {
    list-style: none;
    padding: 0;
    margin: 0;
}

.treasure__item {
    min-height: 72px;
    flex-wrap: wrap;
}

.treasure__name,
.treasure__ask {
    overflow-wrap: anywhere;
    min-width: 0;
}

.treasure__count {
    align-self: flex-start;
    display: inline-flex;
    gap: 8px;
    align-items: center;
}
</style>
