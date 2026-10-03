<template>
    <div v-if="isOpen && current" class="sheet-backdrop" @click.self="close">
        <div v-sheet="close" class="sheet stack" role="dialog" aria-modal="true" aria-labelledby="profile-card-title" data-testid="profile-card">
            <div class="row">
                <AppAvatar :member="current" :size="72" />
                <div class="grow">
                    <h2 id="profile-card-title" class="subtitle">{{ current.name }}</h2>
                    <div class="muted">{{ roleLabel(current.role) }}</div>
                </div>
                <AppButton variant="secondary" size="sm" is-round :aria-label="t('common.close')" @click="close">
                    <AppIcon name="close" :size="22" />
                </AppButton>
            </div>
            <AppButton is-block @click="changePhoto"><AppIcon name="camera" :size="22" motion="wiggle" />{{ t('profile.menu.changePhoto') }}</AppButton>
            <AppButton variant="secondary" is-block data-testid="profile-switch" @click="switchProfile">
                <AppIcon name="users" :size="22" />{{ t('profile.switchProfile') }}
            </AppButton>
        </div>
    </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const isOpen = useState<boolean>('profile-card-open', () => false)
const isSettingsOpen = useState<boolean>('profile-menu-open', () => false)
const isSwitcherOpen = useState<boolean>('switcher-open', () => false)
const requestedView = useState<'menu' | 'photo'>('profile-menu-view', () => 'menu')
const { current } = useCurrentMember()

const close = (): void => {
    isOpen.value = false
}

const changePhoto = (): void => {
    close()
    requestedView.value = 'photo'
    isSettingsOpen.value = true
}

const switchProfile = (): void => {
    close()
    isSwitcherOpen.value = true
}
</script>
