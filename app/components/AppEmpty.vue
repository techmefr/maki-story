<template>
    <div class="stack empty">
        <AppMaki :size="size" class="anim-float" />
        <p class="empty__title">{{ title }}</p>
        <p v-if="hint" class="empty__hint">{{ hint }}</p>
        <slot />
    </div>
</template>

<script setup lang="ts">
const { size = 84 } = defineProps<{ title: string; hint?: string; size?: number }>()
</script>
