<template>
    <div class="homework-mascot" data-testid="homework-mascot">
        <AppMaki :size="size" />
    </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ size?: number }>(), { size: 160 })
</script>

<style scoped>
.homework-mascot {
    display: flex;
    align-items: center;
    justify-content: center;
}
</style>
