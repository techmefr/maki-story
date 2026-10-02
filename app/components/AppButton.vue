<template>
    <component
        :is="to ? NuxtLink : as"
        v-bind="$attrs"
        :to="to"
        :type="isNative ? type : undefined"
        :disabled="isNative ? isInert : undefined"
        :aria-disabled="isInert ? 'true' : undefined"
        :aria-busy="loading ? 'true' : undefined"
        :aria-describedby="showReason ? reasonId : undefined"
        :tabindex="!isNative && isInert ? -1 : undefined"
        class="btn"
        :class="classes"
        @click="onClick"
    >
        <span v-if="loading" class="btn__spinner" aria-hidden="true" />
        <AppIcon v-else-if="icon" :name="icon" :size="iconSize" motion="none" />
        <slot />
    </component>
    <small v-if="showReason" :id="reasonId" class="btn__reason" role="note">{{ disabledReason }}</small>
</template>

<script setup lang="ts">
import { NuxtLink } from '#components'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
    defineProps<{
        variant?: 'primary' | 'secondary' | 'tertiary' | 'destructive'
        size?: 'md' | 'sm'
        tone?: 'sky' | 'mint' | 'grape' | 'pink'
        icon?: IconName
        iconSize?: number
        isBlock?: boolean
        isRound?: boolean
        loading?: boolean
        disabled?: boolean
        disabledReason?: string
        wiggle?: boolean
        to?: string
        as?: 'button' | 'a' | 'label'
        type?: 'button' | 'submit'
    }>(),
    { variant: 'primary', as: 'button', size: 'md', tone: 'sky', iconSize: 22, type: 'button' },
)

const emit = defineEmits<{ click: [event: MouseEvent] }>()

const reasonId = useId()
const isInert = computed(() => props.disabled || props.loading)
const isNative = computed(() => !props.to && props.as === 'button')
const showReason = computed(() => props.disabled && Boolean(props.disabledReason))

const classes = computed(() => [
    `btn--${props.variant}`,
    {
        [`btn--tone-${props.tone}`]: props.variant === 'secondary',
        'btn--small': props.size === 'sm',
        'btn--block': props.isBlock,
        'btn--round': props.isRound,
        'btn--loading': props.loading,
        'btn--wiggle': props.wiggle && !isInert.value,
    },
])

const onClick = (event: MouseEvent): void => {
    if (isInert.value) {
        event.preventDefault()
        event.stopPropagation()
        return
    }
    emit('click', event)
}
</script>
