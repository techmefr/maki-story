<template>
    <section class="stack permissions" data-testid="permissions">
        <h1 class="permissions__title" tabindex="-1">{{ t('permissions.title') }}</h1>
        <p class="permissions__intro">{{ t('permissions.intro') }}</p>
        <ul class="stack permissions__list" :aria-label="t('permissions.listLabel')">
            <li v-for="item in ITEMS" :key="item.kind" class="permissions__item" :data-testid="`permission-${item.kind}`">
                <span class="permissions__icon" :style="{ background: item.color }" aria-hidden="true">
                    <AppIcon :name="item.icon" :size="30" :stroke-width="2.2" />
                </span>
                <span class="permissions__text">
                    <span class="permissions__name">{{ t(`permissions.${item.kind}.name`) }}</span>
                    <span class="permissions__why">{{ t(`permissions.${item.kind}.why`) }}</span>
                    <span v-if="states[item.kind] === 'denied'" class="permissions__hint">{{ t('permissions.deniedHint') }}</span>
                    <span v-else-if="states[item.kind] === 'unsupported'" class="permissions__hint">{{ t('permissions.unsupportedHint') }}</span>
                </span>
                <AppButton
                    size="sm"
                    :variant="states[item.kind] === 'granted' ? 'secondary' : 'primary'"
                    tone="mint"
                    :icon="states[item.kind] === 'granted' ? 'check' : 'plus'"
                    :disabled="states[item.kind] === 'granted' || states[item.kind] === 'unsupported'"
                    class="permissions__action"
                    :data-testid="`permission-allow-${item.kind}`"
                    @click="ask(item.kind)"
                >
                    {{ labelFor(states[item.kind]) }}
                </AppButton>
            </li>
        </ul>
        <AppButton is-block icon="next" class="permissions__continue" data-testid="permissions-continue" @click="emit('continue')">
            {{ t('permissions.continue') }}
        </AppButton>
        <p class="permissions__skip">{{ t('permissions.skipHint') }}</p>
    </section>
</template>

<script setup lang="ts">
interface IPermissionItem {
    kind: TPermissionKind
    icon: IconName
    color: string
}

const ITEMS: IPermissionItem[] = [
    { kind: 'mic', icon: 'mic', color: 'var(--coral)' },
    { kind: 'camera', icon: 'camera', color: 'var(--blue)' },
    { kind: 'notifications', icon: 'bell', color: 'var(--yellow)' },
]

const emit = defineEmits<{ continue: [] }>()

const { t } = useI18n()
const { states, refresh, ask } = useDevicePermissions()

const labelFor = (state: TPermissionState): string => {
    if (state === 'granted') {
        return t('permissions.allowed')
    }
    if (state === 'denied') {
        return t('permissions.denied')
    }
    return state === 'unsupported' ? t('permissions.unsupported') : t('permissions.allow')
}

onMounted(refresh)
</script>

<style scoped>
.permissions {
    gap: 18px;
}

.permissions__title {
    margin: 0;
    font: 700 min(2rem, 10vw) / 1.1 var(--font-title);
}

.permissions__intro {
    margin: 0;
    color: var(--ink-soft);
    font: 500 1.125rem / 1.35 var(--font-body);
}

.permissions__list {
    margin: 0;
    padding: 0;
    list-style: none;
}

.permissions__item {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 14px;
    padding: 14px;
    border: 3px solid var(--ink);
    border-radius: 26px;
    background: var(--paper);
    box-shadow: var(--shadow-lg);
}

.permissions__icon {
    display: flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 60px;
    height: 60px;
    border: 3px solid var(--ink);
    border-radius: 50%;
    color: var(--on-accent);
}

.permissions__text {
    display: flex;
    flex: 1 1 140px;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
}

.permissions__name {
    font: 700 1.25rem / 1.1 var(--font-title);
}

.permissions__why,
.permissions__hint {
    color: var(--ink-soft);
    font: 500 0.9375rem / 1.3 var(--font-body);
}

.permissions__hint {
    font-weight: 700;
}

.permissions__action {
    flex: none;
    min-height: 44px;
}

.permissions__continue {
    min-height: 60px;
    margin-top: 6px;
    font-size: 1.3125rem;
}

.permissions__skip {
    margin: 0;
    color: var(--ink-soft);
    font: 500 0.9375rem / 1.3 var(--font-body);
    text-align: center;
}
</style>
