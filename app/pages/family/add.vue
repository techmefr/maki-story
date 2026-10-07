<template>
    <div class="stack narrow">
        <BackLink to="/family" />
        <h1 class="title">{{ t('family.add.title') }}</h1>
        <MemberForm @saved="done" />
    </div>
</template>

<script setup lang="ts">
const { t } = useI18n()

const done = async (): Promise<void> => {
    await navigateTo('/family')
}
</script>
