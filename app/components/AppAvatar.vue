<template>
    <span
        class="avatar"
        aria-hidden="true"
        :style="{
            width: `${size}px`,
            height: `${size}px`,
            fontSize: `${Math.round(size * 0.46)}px`,
            background: photo ? `center / cover url(${photo})` : hex,
        }"
    >
        <template v-if="!photo">{{ letter }}</template>
    </span>
</template>

<script setup lang="ts">
const { member, size = 44 } = defineProps<{ member: IMember | null; size?: number }>()

const { urlFor } = useMemberPhotos()

const photo = computed(() => urlFor(member))
const hex = computed(() => memberHex(member))
const letter = computed(() => (member ? initialOf(member.name) : '?'))
</script>
