<template>
    <div v-if="!isOnline" class="offline-banner" role="status">
        <AppIcon name="cloud-off" :size="18" />
        <span>Pas de connexion : seuls les livres téléchargés sont disponibles.</span>
    </div>
</template>

<script setup lang="ts">
const isOnline = useState<boolean>('is-online', () => true)
</script>

<style scoped>
.offline-banner {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 60;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px 16px calc(env(safe-area-inset-bottom) + 10px);
    background: #ffc940;
    border-top: 2.5px solid var(--ink);
    font: 700 14px/1.3 var(--font-title);
}
</style>
