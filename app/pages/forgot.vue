<template>
    <div class="stack narrow">
        <ForgotCodeForm @back="goBack" />
    </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'blank' })

const router = useRouter()

const goBack = async (): Promise<void> => {
    if (window.history.length > 1) {
        router.back()
        return
    }
    await navigateTo('/profiles')
}
</script>
