<template>
    <div class="row row--wrap">
        <button
            v-for="member in members"
            :key="member.id"
            type="button"
            class="picker"
            :class="{ 'picker--on': member.id === modelValue }"
            :aria-pressed="member.id === modelValue"
            :style="member.id === modelValue ? { background: hexOf(member), color: 'var(--on-accent)' } : { background: 'var(--paper)', color: 'var(--ink)' }"
            @click="emit('update:modelValue', member.id)"
        >
            <AppAvatar :member="member" :size="32" />
            <span>{{ member.name }}</span>
        </button>
    </div>
</template>

<script setup lang="ts">
defineProps<{ modelValue: string | null }>()
const emit = defineEmits<{ 'update:modelValue': [id: string] }>()

const { people: members } = useMembers()

const hexOf = (member: IMember): string => memberHexLight(member)
</script>
