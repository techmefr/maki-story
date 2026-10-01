<template>
    <div class="stack narrow">
        <NuxtLink to="/family" class="muted">Retour</NuxtLink>
        <h1 class="title">Partage entre familles</h1>

        <section v-if="isParent" class="card stack" aria-labelledby="invite-title">
            <h2 id="invite-title" class="subtitle">Code d’invitation</h2>
            <p class="muted">Donne ce code à une autre famille pour qu’elle puisse t’envoyer un livre ou te demander d’enregistrer ta voix.</p>
            <p v-if="invite && !invite.isRevoked" class="code" aria-label="Code d’invitation de la famille">{{ invite.code }}</p>
            <p v-else class="muted">Le code est désactivé. Renouvelle-le pour inviter de nouveau.</p>
            <div class="row row--wrap">
                <button type="button" class="btn btn--small" @click="rotateInvite">Renouveler le code</button>
                <button v-if="invite && !invite.isRevoked" type="button" class="btn btn--white btn--small" @click="revokeInvite">Désactiver</button>
            </div>
        </section>

        <section v-if="lists.approvals.length > 0" class="stack" aria-labelledby="approvals-title">
            <h2 id="approvals-title" class="subtitle">À valider</h2>
            <article v-for="share in lists.approvals" :key="share.id" class="card stack">
                <div class="subtitle">{{ share.bookTitle }}</div>
                <p class="muted">{{ approvalLabel(share) }}</p>
                <div class="row row--wrap">
                    <button type="button" class="btn btn--mint btn--small" @click="run(() => act(share.id, 'approve'))">Approuver</button>
                    <button type="button" class="btn btn--white btn--small" @click="run(() => act(share.id, 'decline'))">Refuser</button>
                </div>
            </article>
        </section>

        <section v-if="lists.incoming.length > 0" class="stack" aria-labelledby="incoming-title">
            <h2 id="incoming-title" class="subtitle">Reçus</h2>
            <article v-for="share in lists.incoming" :key="share.id" class="card stack">
                <div class="subtitle">{{ share.bookTitle }}</div>
                <p class="muted">{{ incomingLabel(share) }}</p>
                <template v-if="share.status === 'pending' && isParent">
                    <label v-if="share.mode === 'record'" class="stack" style="gap: 6px">
                        <span class="label">Qui enregistre ?</span>
                        <select v-model="recorders[share.id]" class="input">
                            <option value="">Tous les adultes de la famille</option>
                            <option v-for="member in adults" :key="member.id" :value="member.id">{{ member.name }}</option>
                        </select>
                    </label>
                    <div class="row row--wrap">
                        <button type="button" class="btn btn--mint btn--small" @click="accept(share)">Accepter</button>
                        <button type="button" class="btn btn--white btn--small" @click="run(() => act(share.id, 'decline'))">Refuser</button>
                    </div>
                </template>
                <NuxtLink v-if="share.status === 'accepted' && share.mode === 'record'" :to="`/sharing/${share.id}`" class="btn btn--small">
                    Enregistrer ma voix
                </NuxtLink>
                <button v-if="share.status === 'accepted' && isParent" type="button" class="btn btn--white btn--small" @click="run(() => stop(share.id))">
                    Arrêter ce partage
                </button>
            </article>
        </section>

        <section class="stack" aria-labelledby="outgoing-title">
            <h2 id="outgoing-title" class="subtitle">Envoyés</h2>
            <p v-if="lists.outgoing.length === 0" class="muted">Aucun partage envoyé. Utilise le bouton Partager d’un livre de la bibliothèque.</p>
            <article v-for="share in lists.outgoing" :key="share.id" class="card row">
                <div class="grow">
                    <div class="subtitle">{{ share.bookTitle }}</div>
                    <div class="muted">{{ outgoingLabel(share) }}</div>
                </div>
                <button
                    v-if="isParent && !['declined', 'revoked'].includes(share.status)"
                    type="button"
                    class="btn btn--white btn--small"
                    @click="run(() => stop(share.id))"
                >
                    Arrêter
                </button>
            </article>
        </section>
        <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
    </div>
</template>

<script setup lang="ts">
const STATUS_LABELS: Record<ShareStatus, string> = {
    proposed: 'En attente de validation par un parent',
    awaiting_owner: 'En attente de l’accord du propriétaire du livre',
    pending: 'En attente de réponse',
    accepted: 'Accepté',
    declined: 'Refusé',
    revoked: 'Arrêté',
}

const { current } = useCurrentMember()
const { members } = useMembers()
const { lists, invite, load, act, stop, loadInvite, rotateInvite, revokeInvite } = useShares()

const recorders = reactive<Record<string, string>>({})
const errorMessage = ref('')

const isParent = computed(() => current.value?.role === 'parent')
const adults = computed(() => members.value.filter(member => !member.isGuest && member.status === 'active' && member.role !== 'child'))

const modeLabel = (share: IShare): string => (share.mode === 'record' ? `enregistrer ${share.lineCount} répliques` : 'copie dans la bibliothèque')
const approvalLabel = (share: IShare): string => `${share.proposedByName ?? 'Un proche'} voudrait partager ce livre avec ${share.targetFamilyName} (${modeLabel(share)}).`
const incomingLabel = (share: IShare): string => `${share.ownerFamilyName} : ${modeLabel(share)}. ${STATUS_LABELS[share.status]}.`
const outgoingLabel = (share: IShare): string => `Pour ${share.targetFamilyName} : ${modeLabel(share)}. ${STATUS_LABELS[share.status]}.`

const run = async (action: () => Promise<void>): Promise<void> => {
    errorMessage.value = ''
    try {
        await action()
    } catch (_error) {
        errorMessage.value = 'Cette action n’a pas pu être faite pour le moment.'
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
