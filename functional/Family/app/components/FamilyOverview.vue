<template>
    <div class="stack overview">
        <BackLink :to="homePath" />
        <h1 class="title">{{ t('family.index.title') }}</h1>
        <p v-if="usage && usage.limits.adults !== null" class="overview__hint" data-testid="plan-adults-usage">{{ t('family.planUsage', { used: usage.adults, limit: usage.limits.adults }) }}</p>
        <AppButton is-block icon="user-plus" to="/family/invite" data-testid="family-invite">{{ t('family.index.add') }}</AppButton>
        <AppButton is-block variant="secondary" icon="smile" to="/family/add">{{ t('family.index.addChild') }}</AppButton>

        <section v-for="group in groups" :key="group.role" class="stack overview__group" :aria-labelledby="`group-${group.role}`">
            <div class="row">
                <h2 :id="`group-${group.role}`" class="subtitle grow">{{ t(`family.index.groups.${group.role}`) }}</h2>
                <AppBadge>{{ group.members.length }}</AppBadge>
            </div>
            <ul class="overview__list">
                <li v-for="member in group.members" :key="member.id" class="row overview__item">
                    <AppListRow class="grow" :to="`/family/${member.id}`" :title="member.name" :subtitle="subtitleOf(member)">
                        <template #lead><AppAvatar :member="member" :size="48" /></template>
                        <template #action>
                            <AppBadge v-if="hasLegacyCode(member)" tone="warning" data-testid="legacy-code-badge">{{ t('family.index.legacyCode') }}</AppBadge>
                            <AppIcon v-else name="pencil" :size="22" />
                        </template>
                    </AppListRow>
                    <AppIconButton
                        v-if="isRemovable(member)"
                        icon="trash"
                        tone="paper"
                        :label="t('family.index.remove', { name: member.name })"
                        :data-testid="`family-remove-${member.id}`"
                        @click="pending = member"
                    />
                    <span v-else class="overview__spacer" aria-hidden="true" />
                </li>
            </ul>
        </section>

        <AppListRow to="/family/parental" :title="t('lock.menu')" :subtitle="t('lock.menuHint')" data-testid="family-parental">
            <template #lead><AppIcon name="timer-off" :size="28" /></template>
            <template #action><AppIcon name="chevron-right" :size="22" class="mirror-rtl" /></template>
        </AppListRow>

        <AppListRow to="/family/books" :title="t('bookAccess.menu')" :subtitle="t('bookAccess.menuHint')" data-testid="family-books">
            <template #lead><AppIcon name="book" :size="28" /></template>
            <template #action><AppIcon name="chevron-right" :size="22" class="mirror-rtl" /></template>
        </AppListRow>

        <section v-if="guests.length > 0" class="stack overview__group">
            <h2 class="subtitle">{{ t('family.index.guestVoices') }}</h2>
            <p class="overview__hint">{{ t('family.index.guestHint') }}</p>
            <ul class="overview__list">
                <li v-for="member in guests" :key="member.id">
                    <AppListRow :to="`/family/${member.id}`" :title="member.name" :subtitle="t('family.index.guestVoice')">
                        <template #lead><AppAvatar :member="member" :size="48" /></template>
                        <template #action><AppBadge>{{ t('family.index.manage') }}</AppBadge></template>
                    </AppListRow>
                </li>
            </ul>
        </section>

        <section v-if="providers" class="stack overview__group" aria-labelledby="providers-title">
            <AppButton id="providers-title" variant="secondary" is-block icon="lock" :aria-expanded="isProvidersOpen" data-testid="family-providers-toggle" @click="isProvidersOpen = !isProvidersOpen">
                {{ t('family.index.providers.title') }}
            </AppButton>
            <template v-if="isProvidersOpen">
                <p class="overview__hint">{{ t('family.index.providers.hint') }}</p>
                <AppToggle v-for="id in PROVIDER_IDS" :key="id" :model-value="providers[id]" :data-testid="`family-provider-${id}`" @update:model-value="toggleProvider(id, $event)">
                    {{ PROVIDER_LABELS[id] }}
                </AppToggle>
            </template>
        </section>

        <p v-if="hasFailed" class="error" role="alert">{{ t('family.index.failed') }}</p>

        <section class="stack overview__group" aria-labelledby="more-title">
            <h2 id="more-title" class="subtitle">{{ t('family.index.more') }}</h2>
            <AppListRow v-for="link in MORE_LINKS" :key="link.to" :to="link.to" :title="t(link.label)">
                <template #lead><AppIcon :name="link.icon" :size="26" /></template>
            </AppListRow>
        </section>

        <AppBottomSheet :open="pending !== null" :title="t('family.index.confirmTitle', { name: pending?.name ?? '' })" @close="pending = null">
            <p class="overview__hint">{{ t(pending?.role === 'parent' ? 'family.index.confirmParent' : 'family.index.confirmText') }}</p>
            <div class="row">
                <AppButton variant="secondary" class="grow" @click="pending = null">{{ t('common.cancel') }}</AppButton>
                <AppButton class="grow" icon="trash" :disabled="isBusy" data-testid="family-remove-confirm" @click="confirmRemoval">{{ t('family.index.removeAction') }}</AppButton>
            </div>
        </AppBottomSheet>
    </div>
</template>

<script setup lang="ts">
const PROVIDER_IDS: ToggleableProviderId[] = ['apple', 'microsoft', 'facebook']
const MORE_LINKS: { to: string; label: string; icon: IconName }[] = [
    { to: '/vault', label: 'vault.open', icon: 'chest' },
    { to: '/storage', label: 'family.index.storage', icon: 'download' },
    { to: '/sharing', label: 'family.index.sharing', icon: 'send' },
    { to: '/family/devices', label: 'family.index.devices', icon: 'settings' },
    { to: '/family/activity', label: 'recovery.links.activity', icon: 'eye' },
    { to: '/family/trash', label: 'recovery.links.trash', icon: 'trash' },
    { to: '/family/data', label: 'recovery.links.data', icon: 'download' },
    { to: '/help', label: 'help.title', icon: 'smile' },
    { to: '/feedback', label: 'family.index.feedback', icon: 'message-heart' },
]

const { t } = useI18n()
const { homePath } = useCurrentMember()
const { guests } = useMembers()
const { usage, load: loadPlan } = usePlan()
const { groups, providers, pending, hasFailed, isBusy, isRemovable, toggleProvider, confirmRemoval, init } = useFamilyOverview()

const isProvidersOpen = ref(false)

const hasLegacyCode = (member: IMember): boolean => member.role === 'child' && member.codeKind === 'pin'

const subtitleOf = (member: IMember): string => {
    if (member.status === 'blocked' || member.status === 'deceased') {
        return `${roleLabel(member.role)} · ${t(`family.status.${member.status}`)}`
    }
    return roleLabel(member.role)
}

onMounted(async () => {
    await Promise.all([init(), loadPlan()])
})
</script>

<style scoped>
.overview {
    gap: 24px;
}

.overview__group {
    padding: 20px;
    border: var(--outline) solid var(--ink);
    border-radius: 24px;
    background: var(--paper);
    box-shadow: var(--shadow);
    min-width: 0;
}

@media (min-width: 1100px) {
    .overview .overview__list {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 20px;
    }
}

.overview__list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin: 0;
    padding: 0;
    list-style: none;
}

.overview__item {
    align-items: center;
}

.overview__spacer {
    flex: none;
    width: 48px;
}

.overview__hint {
    margin: 0;
    color: var(--ink-soft);
    font: 600 1rem/1.3 var(--font-body);
}
</style>
