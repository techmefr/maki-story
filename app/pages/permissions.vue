<template>
    <div class="stack narrow">
        <PermissionList @continue="proceed" />
    </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'blank' })

const route = useRoute()
const { isRelativeAccount } = useSession()

const proceed = async (): Promise<void> => {
    await navigateTo(safeNextPath(route.query.next, isRelativeAccount.value ? '/relative' : '/home'))
}
</script>
