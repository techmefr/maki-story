<template>
    <g v-if="code === 'fr'">
        <rect width="20" height="40" fill="#2447B5" />
        <rect x="20" width="20" height="40" fill="#fff" />
        <rect x="40" width="20" height="40" fill="#E1313B" />
    </g>
    <g v-else-if="code === 'mg'">
        <rect width="60" height="40" fill="#fff" />
        <rect x="20" width="40" height="20" fill="#E1313B" />
        <rect x="20" y="20" width="40" height="20" fill="#1FA45A" />
    </g>
    <g v-else-if="code === 'en'">
        <rect width="60" height="40" fill="#1F3A93" />
        <path d="M0 0L60 40M60 0L0 40" stroke="#fff" stroke-width="8" />
        <path d="M0 0L60 40M60 0L0 40" stroke="#D42A36" stroke-width="3" />
        <path d="M30 0V40M0 20H60" stroke="#fff" stroke-width="12" />
        <path d="M30 0V40M0 20H60" stroke="#D42A36" stroke-width="7" />
    </g>
    <g v-else-if="code === 'es'">
        <rect width="60" height="40" fill="#D42A36" />
        <rect y="10" width="60" height="20" fill="#F7C52D" />
    </g>
    <g v-else-if="code === 'it'">
        <rect width="20" height="40" fill="#1FA45A" />
        <rect x="20" width="20" height="40" fill="#fff" />
        <rect x="40" width="20" height="40" fill="#D42A36" />
    </g>
    <g v-else-if="code === 'de'">
        <rect width="60" height="14" fill="#1F1B3A" />
        <rect y="14" width="60" height="13" fill="#D42A36" />
        <rect y="27" width="60" height="13" fill="#F7C52D" />
    </g>
    <g v-else-if="code === 'pt'">
        <rect width="24" height="40" fill="#1FA45A" />
        <rect x="24" width="36" height="40" fill="#D42A36" />
        <circle cx="24" cy="20" r="7" fill="#F7C52D" />
    </g>
    <g v-else-if="code === 'zh'">
        <rect width="60" height="40" fill="#D42A36" />
        <path d="M14 6L16.6 14H25L18.2 18.8L20.8 27L14 22L7.2 27L9.8 18.8L3 14H11.4Z" fill="#F7C52D" />
    </g>
    <g v-else-if="code === 'ar'">
        <rect width="60" height="40" fill="#1FA45A" />
        <rect x="14" y="24" width="32" height="3" rx="1.5" fill="#fff" />
        <rect x="18" y="13" width="24" height="3" rx="1.5" fill="#fff" />
    </g>
    <g v-else>
        <rect width="60" height="40" fill="#EEE9FF" />
        <circle cx="30" cy="20" r="10" fill="none" stroke="#1F1B3A" stroke-width="3" />
    </g>
</template>

<script setup lang="ts">
const { code } = defineProps<{ code: string }>()
</script>
