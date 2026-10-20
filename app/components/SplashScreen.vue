<template>
    <div v-if="isVisible" class="splash" :class="{ 'splash--leaving': isLeaving }" :aria-label="t('shell.update.checking')" role="status">
        <img class="splash__art" src="/splash.webp" alt="" />
        <div class="splash__track"><div class="splash__fill" /></div>
    </div>
</template>

<script setup lang="ts">
import { useAppUpdate } from '~~/technical/Storage/app/composables/useAppUpdate'
const { t } = useI18n()
const { checkAtStartup } = useAppUpdate()
const isVisible = ref(false)
const isLeaving = ref(false)
let leaveTimer: ReturnType<typeof setTimeout> | undefined

onMounted(async () => {
    if (import.meta.dev && sessionStorage.getItem('tantara-splash-seen') === '1') return
    isVisible.value = true
    await Promise.all([new Promise(resolve => setTimeout(resolve, 1600)), checkAtStartup()])
    isLeaving.value = true
    leaveTimer = setTimeout(() => { isVisible.value = false }, 400)
})
onBeforeUnmount(() => clearTimeout(leaveTimer))
</script>

<style scoped>
.splash {
    position: fixed;
    inset: 0;
    z-index: 1000;
    overflow: hidden;
    background: #fef1cf;
    pointer-events: auto;
    transition: opacity 0.4s ease;
}

.splash--leaving {
    opacity: 0;
}

.splash__art {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
}

.splash__track {
    position: absolute;
    inset-inline: 0;
    inset-block-end: 17%;
    width: min(32vw, 200px);
    height: 14px;
    margin-inline: auto;
    overflow: hidden;
    border: 1.5px solid #d9b98a;
    border-radius: 999px;
    background: #fbe9bd;
}

.splash__fill {
    width: 100%;
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, #b8651b, #e08a2a);
    transform-origin: left;
    animation: splash-fill 1.5s ease-out forwards;
}

@keyframes splash-fill {
    from {
        transform: scaleX(0.05);
    }

    to {
        transform: scaleX(1);
    }
}

@media (prefers-reduced-motion: reduce) {
    .splash {
        transition: none;
    }

    .splash__fill {
        animation: none;
    }
}
</style>
