<template>
    <div class="app app--full">
        <a class="skip-link" href="#main">{{ t('shell.skip') }}</a>
        <main id="main" tabindex="-1">
            <slot />
        </main>
    </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
</script>
