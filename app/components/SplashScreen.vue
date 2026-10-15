<template>
    <div v-if="isVisible" class="splash" :class="{ 'splash--leaving': isLeaving }" aria-hidden="true">
        <img class="splash__art" src="/splash.webp" alt="" />
        <div class="splash__track"><div class="splash__fill" /></div>
    </div>
</template>

<script setup lang="ts">
const SEEN_KEY = 'tantara-splash-seen'
const SHOW_MS = 1600
const LEAVE_MS = 400

const isVisible = ref(false)
const isLeaving = ref(false)

const hasSeen = (): boolean => {
    try {
        return sessionStorage.getItem(SEEN_KEY) === '1'
    } catch {
        return false
    }
}

onMounted(() => {
    if (hasSeen()) {
        return
    }
    try {
        sessionStorage.setItem(SEEN_KEY, '1')
    } catch {
        return
    }
    isVisible.value = true
    setTimeout(() => {
        isLeaving.value = true
        setTimeout(() => {
            isVisible.value = false
        }, LEAVE_MS)
    }, SHOW_MS)
})
</script>

<style scoped>
.splash {
    position: fixed;
    inset: 0;
    z-index: 1000;
    overflow: hidden;
    background: #fef1cf;
    pointer-events: none;
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
