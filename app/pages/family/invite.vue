<template>
    <div class="stack narrow">
        <NuxtLink to="/family" class="link-back"><AppIcon name="back" :size="18" class="mirror-rtl" />{{ t('common.back') }}</NuxtLink>
        <h1 class="title">{{ t('invite.title') }}</h1>
        <p class="muted">{{ t('invite.hint') }}</p>
        <InviteForm @created="reload" />
        <section class="stack" aria-labelledby="invite-history">
            <h2 id="invite-history" class="subtitle">{{ t('invite.historyTitle') }}</h2>
            <AppEmpty v-if="isLoaded && invitations.length === 0" :title="t('invite.emptyTitle')" :hint="t('invite.emptyHint')" />
            <ul class="stack invite__list">
                <li v-for="item in invitations" :key="item.id" class="card row row--wrap" data-testid="invitation-row">
                    <div class="grow">
                        <div class="subtitle">{{ item.name || t(`invite.channels.${item.channel}`) }}</div>
                        <div class="muted">{{ t(`invite.channels.${item.channel}`) }}{{ item.contact ? ` · ${item.contact}` : '' }}</div>
                    </div>
                    <span class="badge" :data-state="invitationState(item)">{{ t(`invite.state.${invitationState(item)}`) }}</span>
                    <AppButton
                        variant="secondary"
                        size="sm"
                        class="invite__revoke"
                        v-if="invitationState(item) === 'pending'"
                        :aria-label="t('invite.revokeAria', { name: item.name || t(`invite.channels.${item.channel}`) })"
                        @click="revokeOne(item.id)"
                    >
                        <AppIcon name="close" :size="18" />{{ t('invite.revoke') }}
                    </AppButton>
                </li>
            </ul>
        </section>
    </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const { list, revoke } = useInvitations()

const invitations = ref<IInvitation[]>([])
const isLoaded = ref(false)

const reload = async (): Promise<void> => {
    try {
        invitations.value = await list()
    } catch (error) {
        console.error('Les invitations n ont pas pu être chargées', error)
    } finally {
        isLoaded.value = true
    }
}

const revokeOne = async (id: string): Promise<void> => {
    await revoke(id)
    await reload()
}

onMounted(reload)
</script>

<style scoped>
.invite__list {
    list-style: none;
    padding: 0;
    margin: 0;
}

.invite__revoke {
    min-height: 44px;
}
</style>
