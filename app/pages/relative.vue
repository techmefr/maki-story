<template>
    <div class="stack relative">
        <h1 class="title">{{ t('relative.title') }}</h1>
        <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
        <AppEmpty v-if="isLoaded && flow.families.length === 0" :title="t('relative.emptyTitle')" :hint="t('relative.emptyHint')" />
        <section v-for="family in flow.families" :key="family.familyId" class="stack" :aria-labelledby="`family-${family.familyId}`" data-testid="relative-family">
            <h2 :id="`family-${family.familyId}`" class="subtitle">{{ t('relative.family', { name: family.familyName }) }}</h2>
            <div class="grid grid--people">
                <button
                    v-for="child in family.children"
                    :key="child.id"
                    type="button"
                    class="card card--tap row relative__card"
                    :disabled="isBusy"
                    :data-testid="`relative-child-${child.id}`"
                    @click="open(family.familyId, `/message/${child.id}`)"
                >
                    <AppIcon name="message-heart" :size="30" motion="wiggle" />
                    <div class="grow">
                        <div class="subtitle">{{ t('relative.messageFor', { name: child.name }) }}</div>
                        <div class="muted">{{ t('relative.cardMeta', { child: child.name, family: family.familyName }) }}</div>
                    </div>
                </button>
            </div>
            <p v-if="family.children.length === 0" class="muted">{{ t('relative.noChild') }}</p>
            <h3 v-if="family.requests.length > 0" class="label">{{ t('relative.requests') }}</h3>
            <ul class="stack relative__list">
                <li v-for="request in family.requests" :key="`${request.kind}-${request.bookId}-${request.shareId ?? ''}`" class="card row row--wrap" data-testid="relative-request">
                    <AppIcon name="mic" :size="28" />
                    <div class="grow">
                        <div class="subtitle">{{ request.bookTitle }}</div>
                        <div class="muted">{{ t('relative.requestMeta', { count: request.lineCount, family: family.familyName }) }}</div>
                    </div>
                    <AppButton size="sm" class="relative__action" :disabled="isBusy" @click="open(family.familyId, requestPath(request))">
                        <AppIcon name="mic" :size="18" />{{ t('relative.record') }}
                    </AppButton>
                </li>
            </ul>
            <h3 v-if="family.proposals.length > 0" class="label">{{ t('relative.proposals') }}</h3>
            <ul class="stack relative__list">
                <li v-for="proposal in family.proposals" :key="proposal.shareId" class="card row row--wrap" data-testid="relative-proposal">
                    <AppIcon name="book-plus" :size="28" />
                    <div class="grow">
                        <div class="subtitle">{{ proposal.bookTitle }}</div>
                        <div class="muted">{{ t('relative.cardFamily', { family: family.familyName }) }}</div>
                    </div>
                    <span class="badge">{{ t(`relative.proposalStatus.${proposal.status}`) }}</span>
                </li>
            </ul>
        </section>
        <AppButton variant="secondary" is-block class="relative__action" icon="chest" to="/vault">{{ t('vault.open') }}</AppButton>
        <AppButton variant="secondary" is-block class="relative__action" to="/join" data-testid="relative-join-another">
            <AppIcon name="user-plus" :size="22" />{{ t('relative.joinAnother') }}
        </AppButton>
    </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const { flow, isLoaded, load } = useRelativeFlow()
const { switchFamily } = useSession()

const isBusy = ref(false)
const errorMessage = ref('')

const requestPath = (request: IRelativeRequest): string => (request.kind === 'share' && request.shareId ? `/sharing/${request.shareId}` : `/books/${request.bookId}/studio`)

const open = async (familyId: string, path: string): Promise<void> => {
    isBusy.value = true
    errorMessage.value = ''
    try {
        if (flow.value.currentFamilyId !== familyId) {
            await switchFamily(familyId)
        }
        await navigateTo(path)
    } catch (error) {
        console.error('La famille n a pas pu être ouverte', error)
        errorMessage.value = t('relative.openFailed')
    } finally {
        isBusy.value = false
    }
}

onMounted(async () => {
    try {
        await load()
    } catch (error) {
        console.error('Les familles n ont pas pu être chargées', error)
        errorMessage.value = t('relative.loadFailed')
    }
})
</script>

<style scoped>
.relative__list {
    list-style: none;
    padding: 0;
    margin: 0;
}

.relative__card {
    min-height: 72px;
    text-align: start;
}

.relative__action {
    min-height: 48px;
}
</style>
