<template>
    <main class="errstate" role="alert" :data-testid="`error-state-${type}`">
        <div class="errstate__card stack">
            <MakiScene :pose="config.pose" :size="200" />
            <p v-if="config.code" class="errstate__code">{{ config.code }}</p>
            <h1 class="errstate__title">{{ t(`errorState.${type}.title`) }}</h1>
            <p class="errstate__text">{{ t(`errorState.${type}.text`) }}</p>
            <AppButton is-block :icon="config.actionIcon" data-testid="error-action" @click="act">{{ t(`errorState.${type}.action`) }}</AppButton>
        </div>
    </main>
</template>

<script setup lang="ts">
export type TErrorStateType = 'offline' | 'update' | 'error' | 'notFound' | 'forbidden' | 'server'

interface IErrorConfig {
    pose: MakiPose
    icon: IconName
    actionIcon: IconName
    tone: string
    code: string
    retry: boolean
}

const CONFIGS: Record<TErrorStateType, IErrorConfig> = {
    offline: { pose: 'unplugged', icon: 'cloud-off', actionIcon: 'redo', tone: 'var(--sky)', code: '', retry: true },
    update: { pose: 'builder', icon: 'download', actionIcon: 'download', tone: 'var(--yellow)', code: '', retry: true },
    error: { pose: 'confused', icon: 'close', actionIcon: 'redo', tone: 'var(--danger-soft)', code: '', retry: true },
    notFound: { pose: 'detective', icon: 'search', actionIcon: 'home', tone: 'var(--mint-soft)', code: '404', retry: false },
    forbidden: { pose: 'padlock', icon: 'lock', actionIcon: 'home', tone: 'var(--danger-soft)', code: '403', retry: false },
    server: { pose: 'builder', icon: 'settings', actionIcon: 'redo', tone: 'var(--yellow)', code: '500', retry: true },
}

const { type } = defineProps<{ type: TErrorStateType }>()

const { t } = useI18n()

const config = computed<IErrorConfig>(() => CONFIGS[type])
const tone = computed<string>(() => config.value.tone)

const act = async (): Promise<void> => {
    if (config.value.retry) {
        reloadNuxtApp({ persistState: false })
        return
    }
    await clearError({ redirect: '/' })
}
</script>

<style scoped>
.errstate {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100dvh;
    padding: 24px;
    background: var(--bg);
    color: var(--ink);
    text-align: center;
}

.errstate__card {
    align-items: center;
    width: min(100%, 26rem);
}

.errstate__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 112px;
    height: 112px;
    border: var(--outline) solid var(--ink);
    border-radius: 50%;
    box-shadow: var(--shadow-lg);
    color: var(--on-accent);
}

.errstate__code {
    margin: 0;
    font: 700 1rem/1 var(--font-title);
    letter-spacing: 0.1em;
}

.errstate__title {
    margin: 0;
    font: 700 2rem/1.1 var(--font-title);
}

.errstate__text {
    margin: 0;
    color: var(--ink-soft);
    font: 600 1.125rem/1.4 var(--font-body);
}
</style>
