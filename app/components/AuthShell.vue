<template>
    <div class="auth-shell">
        <header class="auth-shell__story">
            <NuxtLink to="/login" class="auth-shell__brand" aria-label="Maki Story">
                <AppLogo :size="64" />
                <span>Maki Story</span>
            </NuxtLink>
            <div class="auth-shell__introduction">
                <h1 v-if="title">{{ title }}</h1>
                <p>{{ tagline }}</p>
            </div>
            <div class="auth-shell__illustration" aria-hidden="true">
                <span class="auth-shell__halo" />
                <MakiScene pose="heartBook" :size="360" />
            </div>
        </header>
        <section class="auth-shell__panel">
            <slot />
        </section>
    </div>
</template>

<script setup lang="ts">
defineProps<{ title?: string; tagline: string }>()
</script>

<style scoped>
.auth-shell {
    width: min(1120px, 100%);
    margin: clamp(12px, 4vh, 64px) auto;
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    border: 2px solid var(--ink);
    border-radius: 36px;
    background: var(--paper);
    box-shadow: 0 12px 0 color-mix(in srgb, var(--ink) 12%, transparent);
    overflow: clip;
}
.auth-shell__story {
    position: relative;
    display: flex;
    flex-direction: column;
    padding: clamp(24px, 4vw, 52px);
    background: #fff0bd;
    color: #271b43;
    border-inline-end: 2px solid var(--ink);
}
.auth-shell__brand {
    display: flex;
    align-items: center;
    gap: 14px;
    width: fit-content;
    max-width: 100%;
    color: inherit;
    text-decoration: none;
    font: 700 clamp(1.5rem, 2.5vw, 2rem)/1.15 var(--font-title);
}
.auth-shell__introduction { margin-top: 40px; }
.auth-shell__introduction h1 {
    margin: 0;
    font: 700 clamp(2rem, 3.5vw, 3rem)/1.12 var(--font-title);
    overflow-wrap: anywhere;
}
.auth-shell__introduction p {
    max-width: 32ch;
    margin: 20px 0 0;
    font-size: 1.125rem;
    line-height: 1.6;
}
.auth-shell__illustration {
    position: relative;
    display: grid;
    place-items: center;
    isolation: isolate;
    margin-top: auto;
    padding-top: 32px;
    min-height: 260px;
}
.auth-shell__halo {
    position: absolute;
    width: 86%;
    aspect-ratio: 1;
    max-height: 290px;
    border-radius: 50%;
    background: #ffdc70;
    z-index: -1;
}
.auth-shell__panel {
    min-width: 0;
    padding: clamp(24px, 4vw, 48px);
    align-self: center;
}
@media (min-width: 1800px) {
    .auth-shell { margin-block: 7vh; }
}
@media (max-width: 799px) {
    .auth-shell { grid-template-columns: minmax(0, 1fr); border-radius: 26px; }
    .auth-shell__story { border-inline-end: 0; border-bottom: 2px solid var(--ink); padding: 24px; }
    .auth-shell__introduction { margin-top: 24px; }
    .auth-shell__introduction h1 { font-size: 1.8rem; }
    .auth-shell__introduction p { max-width: none; margin-top: 12px; font-size: 1rem; }
    .auth-shell__illustration { display: none; }
}
</style>
