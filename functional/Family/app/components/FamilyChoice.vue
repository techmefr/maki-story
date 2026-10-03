<template>
    <div class="stack choice">
        <h1 class="title">{{ t('family.choose.title') }}</h1>
        <p class="choice__intro">{{ t('family.choose.intro') }}</p>
        <p v-if="hasFailed" class="error" role="alert">{{ t('family.choose.failed') }}</p>
        <ul class="choice__list">
            <li v-for="item in memberships" :key="item.familyId">
                <button type="button" class="choice__card" :disabled="isBusy" :data-testid="`family-choice-${item.familyId}`" @click="choose(item.familyId)">
                    <span class="choice__icon"><AppIcon name="home" :size="32" /></span>
                    <span class="choice__text">
                        <span class="choice__name">{{ item.familyName }}</span>
                        <span class="choice__kids">{{ t('family.choose.kids', { count: item.childCount }) }}</span>
                    </span>
                    <AppBadge :tone="item.role === 'parent' ? 'info' : 'warning'">{{ t(`family.choose.role.${item.role}`) }}</AppBadge>
                </button>
            </li>
        </ul>
        <AppEmpty v-if="isLoaded && memberships.length === 0" :title="t('family.choose.emptyTitle')" :hint="t('family.choose.emptyHint')" />
        <AppButton is-block icon="plus" to="/join" class="choice__join">{{ t('family.choose.join') }}</AppButton>
        <AppButton is-block variant="secondary" icon="home" to="/families/new">{{ t('family.choose.create') }}</AppButton>
    </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const { memberships, isLoaded, isBusy, hasFailed, load, choose } = useFamilies()

onMounted(load)
</script>

<style scoped>
.choice__intro {
    margin: 0;
    color: var(--ink-soft);
    font: 600 1.125rem/1.3 var(--font-body);
}

.choice__list {
    display: flex;
    flex-direction: column;
    gap: 14px;
    margin: 0;
    padding: 0;
    list-style: none;
}

.choice__card {
    display: flex;
    align-items: center;
    gap: 14px;
    width: 100%;
    min-height: var(--tap);
    padding: 14px;
    border: var(--outline) solid var(--ink);
    border-radius: 26px;
    background: var(--paper);
    box-shadow: var(--shadow);
    color: var(--ink);
    text-align: start;
    cursor: pointer;
}

.choice__icon {
    display: flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 64px;
    height: 64px;
    border: var(--outline) solid var(--ink);
    border-radius: 50%;
    background: var(--sky);
    color: var(--on-accent);
}

.choice__text {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
}

.choice__name {
    font: 700 1.375rem/1.1 var(--font-title);
    overflow-wrap: anywhere;
}

.choice__kids {
    color: var(--ink-soft);
    font: 600 0.9375rem/1.2 var(--font-body);
}

.choice__join {
    margin-top: auto;
}
</style>
