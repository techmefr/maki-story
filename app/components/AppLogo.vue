<template>
    <img src="/logo-256.webp" :alt="alt" :width="size" :height="size" class="logo" decoding="async" />
</template>

<script setup lang="ts">
withDefaults(defineProps<{ size?: number; alt?: string }>(), { size: 48, alt: '' })
</script>

<style scoped>
.logo {
    display: block;
    border-radius: 22%;
    object-fit: cover;
}
</style>
