<template>
    <div class="appearance-picker">
        <p class="appearance-picker__hint">{{ t('appearance.hint') }}</p>
        <div class="appearance-picker__choices" role="group" :aria-label="t('appearance.title')">
            <button v-for="scene in appearances" :key="scene" type="button" class="appearance-picker__choice" :class="`appearance-picker__choice--${scene}`" :aria-pressed="appearance === scene" :data-appearance-choice="scene" @click="choose(scene)">
                <span class="appearance-picker__preview" aria-hidden="true"><span class="appearance-picker__sample" /></span>
                <span>{{ t(`appearance.scenes.${scene}`) }}</span>
                <AppIcon v-if="appearance === scene" name="check" :size="20" class="appearance-picker__check" />
            </button>
        </div>
        <AppButton variant="secondary" size="sm" icon="play" @click="previewRequest++">{{ t('appearance.preview') }}</AppButton>
        <p class="appearance-picker__hint" role="status">{{ t('appearance.saved') }}</p>
    </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const previewRequest = useState<number>('splash-preview', () => 0)
const { appearance, appearances, choose } = useAppearance()
</script>

<style scoped>
.appearance-picker { display: grid; gap: 12px; }
.appearance-picker__hint { margin: 0; color: var(--ink-soft); font-size: 0.9375rem; }
.appearance-picker__choices { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
.appearance-picker__choice { position: relative; display: flex; flex-direction: column; gap: 10px; align-items: center; min-width: 0; min-height: 120px; padding: 8px 8px 12px; border: 2px solid var(--line); border-radius: 18px; background: var(--paper); color: var(--ink); font: 600 0.9375rem/1.3 var(--font-body); overflow-wrap: anywhere; cursor: pointer; }
.appearance-picker__choice[aria-pressed='true'] { outline: 3px solid var(--yellow); outline-offset: 2px; }
.appearance-picker__preview { display: grid; place-items: center; width: 100%; height: 80px; border-radius: 10px; background: url('/art/child/storybook-world.jpg') center / 100% 100%; }
.appearance-picker__sample { width: 48%; height: 32px; border: 2px solid #82532c; border-radius: 8px; background: #fff5df; box-shadow: 0 3px 0 #82532c; }
.appearance-picker__choice--notebook .appearance-picker__preview { background: repeating-linear-gradient(to bottom, #fff6e5 0 12px, #dfcbb2 13px, #fff6e5 14px 24px); border-inline-start: 6px solid #ac7950; }
.appearance-picker__choice--library .appearance-picker__preview { background-image: url('/art/child/library-world.webp'); }
.appearance-picker__check { position: absolute; top: 12px; inset-inline-end: 12px; padding: 2px; border-radius: 50%; background: #ffc933; color: #4b260f; }
@media (max-width: 389px) {
    .appearance-picker__choices { grid-template-columns: 1fr; }
    .appearance-picker__choice { flex-direction: row; min-height: 64px; text-align: start; padding: 8px; }
    .appearance-picker__preview { width: 64px; height: 52px; flex-shrink: 0; }
    .appearance-picker__check { position: static; flex-shrink: 0; margin-inline-start: auto; }
}
</style>
