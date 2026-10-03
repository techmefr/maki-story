<template>
    <div class="stack narrow">
        <AccountPanel @back="goBack" @deleted="afterDelete" />
    </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'blank' })

const { isRelativeAccount } = useSession()

const goBack = async (): Promise<void> => {
    await navigateTo(isRelativeAccount.value ? '/relative' : '/family')
}

const afterDelete = async (): Promise<void> => {
    await navigateTo('/onboarding', { external: true })
}
</script>
