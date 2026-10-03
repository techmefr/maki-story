<template>
    <div class="stack relprof">
        <div class="row relprof__head">
            <AppAvatar :member="member" :size="64" />
            <div class="grow">
                <h1 class="title">{{ member.name }}</h1>
                <AppBadge :tone="member.role === 'parent' ? 'info' : 'success'">{{ roleLabel(member.role) }}</AppBadge>
            </div>
        </div>

        <section v-if="overview && overview.messages.length > 0" class="stack relprof__card" aria-labelledby="relprof-messages">
            <h2 id="relprof-messages" class="subtitle">{{ t('relativeProfile.messages') }}</h2>
            <ul class="relprof__kids">
                <li v-for="item in overview.messages" :key="item.childId" class="row relprof__kid">
                    <span class="relprof__initial" :style="{ background: getVoiceColor(item.childColor).hex }" aria-hidden="true">{{ item.childName.charAt(0) }}</span>
                    <span class="relprof__name">{{ item.childName }}</span>
                    <span class="relprof__cells" aria-hidden="true">
                        <span v-for="cell in MESSAGE_MAX" :key="cell" class="relprof__cell" :class="{ 'relprof__cell--on': cell <= item.count }" />
                    </span>
                    <span class="relprof__count">{{ t('relativeProfile.count', { count: item.count, max: MESSAGE_MAX }) }}</span>
                </li>
            </ul>
        </section>

        <section v-if="overview && overview.families.length > 0" class="stack relprof__card" aria-labelledby="relprof-families">
            <h2 id="relprof-families" class="subtitle">{{ t('relativeProfile.families') }}</h2>
            <p class="relprof__text">{{ overview.families.join(' · ') }}</p>
        </section>

        <p v-if="hasFailed" class="error" role="alert">{{ t('relativeProfile.failed') }}</p>
        <p v-else-if="message" class="relprof__text" role="status">{{ message }}</p>

        <AppButton is-block variant="secondary" icon="redo" :disabled="isBusy" data-testid="relative-reset-code" @click="onReset">{{ t('relativeProfile.resetCode') }}</AppButton>
        <AppButton is-block variant="secondary" icon="users" :disabled="isBusy" data-testid="relative-toggle-role" @click="onToggleRole">
            {{ member.role === 'parent' ? t('relativeProfile.makeRelative') : t('relativeProfile.makeParent') }}
        </AppButton>
        <AppButton is-block variant="secondary" icon="trash" :disabled="isBusy" data-testid="relative-remove" @click="isConfirming = true">{{ t('relativeProfile.remove') }}</AppButton>

        <AppBottomSheet :open="isConfirming" :title="t('family.index.confirmTitle', { name: member.name })" @close="isConfirming = false">
            <p class="relprof__text">{{ t('family.index.confirmText') }}</p>
            <div class="row">
                <AppButton variant="secondary" class="grow" @click="isConfirming = false">{{ t('common.cancel') }}</AppButton>
                <AppButton class="grow" icon="trash" :disabled="isBusy" data-testid="relative-remove-confirm" @click="onRemove">{{ t('family.index.removeAction') }}</AppButton>
            </div>
        </AppBottomSheet>
    </div>
</template>

<script setup lang="ts">
const MESSAGE_MAX = MESSAGE_MAX_ACTIVE

const { member } = defineProps<{ member: IMember }>()

const { t } = useI18n()
const { overview, message, hasFailed, isBusy, loadOverview, resetCode, changeRole, removeFromFamily } = useRelativeProfile(member.id)

const isConfirming = ref(false)

const onReset = async (): Promise<void> => {
    if (await resetCode()) {
        message.value = t('relativeProfile.codeReset', { name: member.name })
    }
}

const onToggleRole = async (): Promise<void> => {
    const next: InvitationRole = member.role === 'parent' ? 'relative' : 'parent'
    if (await changeRole(next)) {
        message.value = t(`relativeProfile.nowRole.${next}`, { name: member.name })
        await loadOverview()
    }
}

const onRemove = async (): Promise<void> => {
    if (await removeFromFamily()) {
        await navigateTo('/family')
    }
}

onMounted(loadOverview)
</script>

<style scoped>
.relprof__head {
    gap: 14px;
}

.relprof__card {
    padding: 16px;
    border: var(--outline) solid var(--ink);
    border-radius: 22px;
    background: var(--paper);
    box-shadow: var(--shadow);
}

.relprof__text {
    margin: 0;
    color: var(--ink-soft);
    font: 600 1rem/1.3 var(--font-body);
}

.relprof__kids {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin: 0;
    padding: 0;
    list-style: none;
}

.relprof__kid {
    gap: 10px;
}

.relprof__initial {
    display: flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: var(--outline) solid var(--ink);
    border-radius: 50%;
    color: var(--on-accent);
    font: 700 1rem/1 var(--font-title);
}

.relprof__name {
    flex: 1;
    min-width: 0;
    font: 700 1rem/1.2 var(--font-title);
}

.relprof__cells {
    display: flex;
    gap: 4px;
}

.relprof__cell {
    width: 14px;
    height: 14px;
    border: 2px solid var(--ink);
    border-radius: 50%;
    background: transparent;
}

.relprof__cell--on {
    background: var(--ink);
}

.relprof__count {
    min-width: 2.5em;
    text-align: end;
    font: 700 0.875rem/1 var(--font-body);
}
</style>
