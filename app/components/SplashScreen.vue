<template>
    <div v-if="isVisible" class="splash" :class="{ 'splash--leaving': isLeaving }" :aria-label="t(isPreview ? 'appearance.loading' : 'shell.update.checking')" role="status">
        <ChildFoliage class="splash__foliage" />
        <div class="splash__center">
            <img class="splash__art" :src="makiSrc('hushHeadphones')" alt="" width="520" height="520" fetchpriority="high" />
            <h1 class="splash__brand">{{ APP_NAME }}</h1>
            <p class="splash__caption">{{ t('appearance.loading') }}</p>
            <div class="splash__track"><div class="splash__fill" /></div>
        </div>
    </div>
</template>

<script setup lang="ts">
import ChildFoliage from '~~/technical/Motion/app/components/ChildFoliage.vue'
import { useAppUpdate } from '~~/technical/Storage/app/composables/useAppUpdate'
const { t } = useI18n()
const { checkAtStartup } = useAppUpdate()
const isVisible = ref(false)
const isLeaving = ref(false)
const previewRequest = useState<number>('splash-preview', () => 0)
const isPreview = ref(false)
let previewTimer: ReturnType<typeof setTimeout> | undefined
let leaveTimer: ReturnType<typeof setTimeout> | undefined

onMounted(async () => {
    if (import.meta.dev && sessionStorage.getItem('tantara-splash-seen') === '1') return
    isVisible.value = true
    await Promise.all([new Promise(resolve => setTimeout(resolve, 1600)), checkAtStartup()])
    isLeaving.value = true
    leaveTimer = setTimeout(() => { isVisible.value = false }, 400)
})
watch(previewRequest, () => {
    clearTimeout(leaveTimer)
    clearTimeout(previewTimer)
    isPreview.value = true
    isLeaving.value = false
    isVisible.value = true
    previewTimer = setTimeout(() => {
        isLeaving.value = true
        leaveTimer = setTimeout(() => {
            isVisible.value = false
            isPreview.value = false
        }, 400)
    }, 1600)
})
onBeforeUnmount(() => {
    clearTimeout(leaveTimer)
    clearTimeout(previewTimer)
})
</script>

<style scoped>
.splash {
    position: fixed;
    inset: 0;
    z-index: 1000;
    isolation: isolate;
    display: grid;
    place-items: center;
    overflow: hidden;
    padding: max(20px, env(safe-area-inset-top)) max(20px, env(safe-area-inset-right)) max(20px, env(safe-area-inset-bottom)) max(20px, env(safe-area-inset-left));
    background: #fff3d6;
    color: #4b260f;
    pointer-events: auto;
    transition: opacity 0.4s ease;
}
.splash::before { content: ''; position: absolute; inset: 0; z-index: -1; background: var(--appearance-scene, url('/art/child/storybook-portrait.webp')) center / 100% 100% no-repeat; }
.splash--leaving { opacity: 0; }
.splash__center { position: relative; z-index: 2; display: flex; flex-direction: column; align-items: center; gap: 16px; max-width: min(560px, 76vw); text-align: center; }
.splash__art { display: block; width: min(300px, 58vw, 40svh); height: min(300px, 58vw, 40svh); object-fit: contain; filter: drop-shadow(0 12px 18px #5d391e26); }
.splash__brand { margin: -24px 0 0; padding: 16px 28px; border: 3px solid #ae7638; border-radius: 20px 16px 24px 18px; background: var(--appearance-wood); box-shadow: 0 5px 0 #71401e; color: #fff4d6; font: 700 clamp(2rem, 6vw, 3.75rem)/1.1 Fredoka, sans-serif; }
.splash__caption { margin: 4px 0 0; padding: 6px 12px; border-radius: 12px; background: #fff3d6; font: 600 1rem/1.4 var(--font-body); }
.splash__foliage { --foliage-leaf-size: clamp(80px, max(12vw, 12vh), min(260px, 22vw, 30vh)); position: absolute; z-index: 1; mask-image: none; }
.splash__track { width: min(55vw, 220px); height: 14px; overflow: hidden; border: 2px solid #946434; border-radius: 999px; background: #fbe9bd; }
.splash__fill { width: 100%; height: 100%; border-radius: 999px; background: linear-gradient(90deg, #e4a41c, #ffce3a); transform-origin: left; animation: splash-fill 1.5s ease-out forwards; }
:global(html[data-appearance='notebook']) .splash__brand { color: #4b260f; }
:global(html[data-theme='dark']) .splash { background: #211d19; }
:global(html[data-theme='dark']) .splash::before { filter: brightness(0.35); }
@keyframes splash-fill { from { transform: scaleX(0.05); } to { transform: scaleX(1); } }
@media (orientation: landscape) and (max-height: 600px) {
    .splash__center { gap: 8px; }
    .splash__art { width: 35svh; height: 35svh; }
    .splash__brand { margin-top: -12px; padding: 8px 24px; font-size: 1.75rem; }
    .splash__caption { font-size: 0.9375rem; }
}
@media (prefers-reduced-motion: reduce) { .splash { transition: none; } .splash__fill { animation: none; } }
</style>
