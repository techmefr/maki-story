<template>
    <div v-if="member" class="stack center narrow">
        <AppButton variant="secondary" is-round to="/kid" :aria-label="t('common.back')"><AppIcon name="back" :size="26" class="mirror-rtl" /></AppButton>
        <AppAvatar :member="member" :size="150" />
        <h1 class="title">{{ member.name }}</h1>
        <AppButton variant="secondary" tone="mint" is-block v-if="incoming" :to="`/message/listen/${incoming.id}`" class="anim-pulse" style="min-height: 72px; font-size: 1.375rem">
            <AppIcon name="volume" :size="32" motion="pulse" />
            {{ t('kid.listenHer') }}
        </AppButton>
        <AppButton is-block :to="`/message/${member.id}`" style="min-height: 72px; font-size: 1.375rem">
            <AppIcon name="mic" :size="32" motion="wiggle" />
            {{ t('kid.sendMessage') }}
        </AppButton>
        <span v-if="sentLabel" class="badge">{{ sentLabel }}</span>
        <div class="stack" style="width: 100%; text-align: start">
            <NuxtLink
                v-for="book in soloBooks"
                :key="book.id"
                :to="`/kid/listen/${book.id}`"
                class="card card--tap row"
                style="color: inherit; text-decoration: none; min-height: 72px"
                :style="{ background: hexOfBook(book) }"
            >
                <span class="subtitle grow">{{ book.title }}</span>
                <span class="play-chip"><AppIcon name="play" :size="26" motion="pulse" /></span>
            </NuxtLink>
            <AppEmpty kind="library" v-if="soloBooks.length === 0" :title="t('kid.noSoloStory')" :hint="t('kid.noSoloHint')" />
        </div>
    </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'kid' })

const { t } = useI18n()
const route = useRoute()
const { getById } = useMembers()
const { currentId } = useCurrentMember()
const { readyBooks, load: loadBooks } = useBooks()
const { load, startPolling, stopPolling, playableFrom, lastSentTo } = useMessages()

const member = computed(() => getById(String(route.params.id)))
const soloBooks = computed(() => readyBooks.value.filter(book => book.kind === 'solo' && book.soloMemberId === member.value?.id))
const incoming = computed(() => (currentId.value && member.value ? playableFrom(member.value.id, currentId.value) : null))
const sentLabel = computed(() => {
    const sent = currentId.value && member.value ? lastSentTo(currentId.value, member.value.id) : null
    if (!sent) {
        return ''
    }
    return sent.listenedAt ? t('messages.status.heard') : t('messages.status.sent')
})

const hexOfBook = (book: IBookSummary): string => pickVoiceByText(book.id).hex

onMounted(async () => {
    await Promise.all([loadBooks(), load()])
    startPolling()
})

onBeforeUnmount(stopPolling)
</script>
