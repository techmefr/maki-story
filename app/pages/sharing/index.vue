<template>
    <div class="stack narrow">
        <NuxtLink to="/family" class="muted">{{ t('common.back') }}</NuxtLink>
        <h1 class="title">{{ t('sharing.title') }}</h1>

        <section v-if="isParent" class="card stack" aria-labelledby="invite-title">
            <h2 id="invite-title" class="subtitle">{{ t('sharing.invite.title') }}</h2>
            <p class="muted">{{ t('sharing.invite.help') }}</p>
            <p v-if="invite && !invite.isRevoked" class="code" :aria-label="t('sharing.invite.codeLabel')">{{ invite.code }}</p>
            <p v-else class="muted">{{ t('sharing.invite.revoked') }}</p>
            <div class="row row--wrap">
                <AppButton size="sm" @click="rotateInvite">{{ t('sharing.invite.renew') }}</AppButton>
                <AppButton variant="secondary" size="sm" v-if="invite && !invite.isRevoked" @click="revokeInvite">{{ t('sharing.invite.disable') }}</AppButton>
            </div>
        </section>

        <section v-if="lists.approvals.length > 0" class="stack" aria-labelledby="approvals-title">
            <h2 id="approvals-title" class="subtitle">{{ t('sharing.approvals.title') }}</h2>
            <article v-for="share in lists.approvals" :key="share.id" class="card stack">
                <div class="subtitle">{{ share.bookTitle }}</div>
                <p class="muted">{{ approvalLabel(share) }}</p>
                <div class="row row--wrap">
                    <AppButton variant="secondary" tone="mint" size="sm" @click="run(() => act(share.id, 'approve'))">{{ t('sharing.approve') }}</AppButton>
                    <AppButton variant="secondary" size="sm" @click="run(() => act(share.id, 'decline'))">{{ t('sharing.decline') }}</AppButton>
                </div>
            </article>
        </section>

        <section v-if="lists.incoming.length > 0" class="stack" aria-labelledby="incoming-title">
            <h2 id="incoming-title" class="subtitle">{{ t('sharing.incoming.title') }}</h2>
            <article v-for="share in lists.incoming" :key="share.id" class="card stack">
                <div class="subtitle">{{ share.bookTitle }}</div>
                <p class="muted">{{ incomingLabel(share) }}</p>
                <template v-if="share.status === 'pending' && isParent">
                    <div v-if="share.mode === 'record'" class="stack" style="gap: 6px">
                        <span :id="`who-records-${share.id}`" class="label">{{ t('sharing.whoRecords') }}</span>
                        <AppSelect :model-value="recorders[share.id] ?? ''" @update:model-value="recorders[share.id] = String($event ?? '')" :aria-labelledby="`who-records-${share.id}`" :options="recorderOptions" />
                    </div>
                    <div class="row row--wrap">
                        <AppButton variant="secondary" tone="mint" size="sm" @click="accept(share)">{{ t('sharing.accept') }}</AppButton>
                        <AppButton variant="secondary" size="sm" @click="run(() => act(share.id, 'decline'))">{{ t('sharing.decline') }}</AppButton>
                    </div>
                </template>
                <AppButton size="sm" v-if="share.status === 'accepted' && share.mode === 'record'" :to="`/sharing/${share.id}`">
                    {{ t('sharing.recordMyVoice') }}
                </AppButton>
                <AppButton variant="secondary" size="sm" v-if="share.status === 'accepted' && isParent" @click="run(() => stop(share.id))">
                    {{ t('sharing.stopShare') }}
                </AppButton>
            </article>
        </section>

        <section class="stack" aria-labelledby="outgoing-title">
            <h2 id="outgoing-title" class="subtitle">{{ t('sharing.outgoing.title') }}</h2>
            <p v-if="lists.outgoing.length === 0" class="muted">{{ t('sharing.noOutgoing') }}</p>
            <article v-for="share in lists.outgoing" :key="share.id" class="card row">
                <div class="grow">
                    <div class="subtitle">{{ share.bookTitle }}</div>
                    <div class="muted">{{ outgoingLabel(share) }}</div>
                </div>
                <AppButton variant="secondary" size="sm"
                    v-if="isParent && !['declined', 'revoked'].includes(share.status)"
                    @click="run(() => stop(share.id))">
                    {{ t('sharing.stop') }}
                </AppButton>
            </article>
        </section>
        <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
    </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const recorderOptions = computed(() => [{ value: '', label: t('sharing.allAdults') }, ...adults.value.map(member => ({ value: member.id, label: member.name }))])
const { current } = useCurrentMember()
const { members } = useMembers()
const { lists, invite, load, act, stop, loadInvite, rotateInvite, revokeInvite } = useShares()

const recorders = reactive<Record<string, string>>({})
const errorMessage = ref('')

const isParent = computed(() => current.value?.role === 'parent')
const adults = computed(() => members.value.filter(member => !member.isGuest && member.status === 'active' && member.role !== 'child'))

const modeLabel = (share: IShare): string => (share.mode === 'record' ? t('sharing.mode.record', { count: share.lineCount }) : t('sharing.mode.copy'))
const approvalLabel = (share: IShare): string =>
    t('sharing.approvalLabel', { name: share.proposedByName ?? t('sharing.proposerFallback'), family: share.targetFamilyName, mode: modeLabel(share) })
const incomingLabel = (share: IShare): string =>
    t('sharing.incomingLabel', { family: share.ownerFamilyName, mode: modeLabel(share), status: t(`sharing.status.${share.status}`) })
const outgoingLabel = (share: IShare): string =>
    t('sharing.outgoingLabel', { family: share.targetFamilyName, mode: modeLabel(share), status: t(`sharing.status.${share.status}`) })

const run = async (action: () => Promise<void>): Promise<void> => {
    errorMessage.value = ''
    try {
        await action()
    } catch (_error) {
        errorMessage.value = t('sharing.actionFailed')
    }
}

const accept = (share: IShare): Promise<void> => {
    const recorderMemberId = recorders[share.id] || null
    return run(() => act(share.id, 'accept', { recorderMemberId }))
}

onMounted(async () => {
    await run(load)
    if (isParent.value) {
        await run(loadInvite)
    }
})
</script>

<style scoped>
.code {
    font: 700 32px/1.2 var(--font-title);
    letter-spacing: 0.12em;
    word-break: break-all;
}
</style>
