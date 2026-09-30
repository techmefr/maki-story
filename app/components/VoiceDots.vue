<template>
    <span class="dots">
        <span v-for="member in people" :key="member.id" class="dot" :style="{ background: hexOf(member) }" />
    </span>
</template>

<script setup lang="ts">
const { memberIds } = defineProps<{ memberIds: string[] }>()

const { getById } = useMembers()

const people = computed(() =>
    memberIds.map(id => getById(id)).filter((member): member is IMember => member !== null),
)

const hexOf = (member: IMember): string => memberHex(member)
</script>
