<template>
    <section class="reading-page">
        <div v-if="reader" class="reading-page__speaker">
            <AppBlob :active="isPlaying" :color="memberHex(reader)" :size="192"><AppAvatar :member="reader" :size="176" /></AppBlob>
            <h2 class="reading-page__name" :title="reader.name">{{ reader.name }}</h2>
            <WaveBars :is-active="isPlaying" color="var(--yellow)" />
        </div>
        <MakiScene pose="hushHeadphones" :size="144" class="reading-page__maki" />
    </section>
</template>

<script setup lang="ts">
defineProps<{ reader: IMember | null; isPlaying: boolean }>()
</script>

<style scoped>
.reading-page { display: grid; place-items: center; gap: 20px; width: 100%; min-width: 0; max-width: 960px; margin-inline: auto; }
.reading-page__speaker { display: grid; justify-items: center; gap: 16px; min-width: 0; max-width: 100%; }
.reading-page__name { margin: 0; max-width: 100%; overflow-wrap: anywhere; text-align: center; font: 600 clamp(1.5rem, 4vw, 2.5rem)/1.2 var(--font-title); }
.reading-page__speaker :deep(.avatar) { border: 6px solid #b97531; box-shadow: 0 5px 0 #71401e, 0 0 0 4px #ffdc85; }
.reading-page__speaker :deep(.bars) { height: 36px; }
@media (orientation: landscape) and (max-height: 600px) {
    .reading-page { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 12px; }
    .reading-page__speaker { gap: 8px; }
    .reading-page__speaker :deep(.blob) { width: 112px !important; height: 112px !important; }
    .reading-page__speaker :deep(.avatar) { width: 104px !important; height: 104px !important; }
    .reading-page__maki { max-height: 100px; }
}
@media (min-width: 1600px) {
    .reading-page { grid-template-columns: 2fr 1fr; }
    .reading-page__speaker :deep(.avatar) { width: clamp(200px, 15vw, 480px) !important; height: clamp(200px, 15vw, 480px) !important; }
    .reading-page__speaker :deep(.blob) { width: auto !important; height: auto !important; }
}
</style>
