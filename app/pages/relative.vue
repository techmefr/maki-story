<template>
    <div class="stack relative">
        <div class="relative__heading">
            <h1 class="title grow">{{ t('relative.title') }}</h1>
            <AppButton to="/books/new" icon="book-plus">{{ t('home.dash.proposeBook') }}</AppButton>
        </div>
        <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
        <AppEmpty v-if="isLoaded && flow.families.length === 0" :title="t('relative.emptyTitle')" :hint="t('relative.emptyHint')" />
        <div class="relative__families">
            <span v-for="family in flow.families" :key="family.familyId" class="badge" data-testid="relative-family">{{ family.familyName }}</span>
        </div>
        <RelativeHomeFeed show-children />
        <div class="relative__links">
            <AppButton variant="secondary" icon="chest" to="/vault">{{ t('vault.open') }}</AppButton>
            <AppButton variant="secondary" icon="smile" to="/help">{{ t('help.title') }}</AppButton>
            <AppButton variant="secondary" icon="user-plus" to="/join" data-testid="relative-join-another">{{ t('relative.joinAnother') }}</AppButton>
        </div>
    </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const { flow, isLoaded, load } = useRelativeFlow()
const errorMessage = ref('')

onMounted(async () => {
    try {
        await load()
    } catch (error) {
        console.error('Impossible de charger les familles', error)
        errorMessage.value = t('relative.loadFailed')
    }
})
</script>

<style scoped>
.relative {
    gap: 28px;
}

.relative__heading,
.relative__families,
.relative__links {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 16px;
}
</style>
