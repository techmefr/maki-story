<template>
    <main class="locked" data-testid="locked-screen">
        <AppMaki :size="180" class="locked__maki" />
        <PictureClock :time="resumeTime" :label="t('parental.locked.clock')" />
        <div class="locked__moon" aria-hidden="true">
            <AppIcon name="moon" :size="64" motion="float" />
        </div>
        <AppButton is-round class="locked__parent" :aria-label="t('parental.locked.toParent')" data-testid="locked-parent" @click="goToParent">
            <AppIcon name="lock" :size="28" />
        </AppButton>
    </main>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'blank' })

const { t } = useI18n()
const { status } = useAccess()
const { lock } = useCurrentMember()

const resumeTime = computed(() => (status.value.resumeAt ? new Date(status.value.resumeAt) : null))

const goToParent = async (): Promise<void> => {
    await lock()
    await navigateTo('/profiles')
}
</script>

<style scoped>
.locked {
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
    padding: 1.5rem;
    background: #3b3470;
    position: relative;
    overflow: hidden;
}

.locked__moon {
    color: #ffc940;
}

.locked__parent {
    position: absolute;
    right: 1rem;
    bottom: 1rem;
    min-width: 4rem;
    min-height: 4rem;
}
</style>
