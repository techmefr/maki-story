<template>
    <img src="/logo-256.webp" alt="Tantara" :width="size" :height="size" class="logo" decoding="async" />
</template>

<script setup lang="ts">
withDefaults(defineProps<{ size?: number }>(), { size: 48 })
</script>

<style scoped>
.logo {
    display: block;
    border-radius: 22%;
    object-fit: cover;
}
</style>
