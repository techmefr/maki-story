<template>
    <component
        :is="icon"
        class="icon"
        :class="[`icon--${motion}`, { 'icon--on': isActive }]"
        :size="size"
        :stroke-width="strokeWidth"
        aria-hidden="true"
    />
</template>

<script setup lang="ts">
import {
    ArrowLeft,
    ArrowRight,
    BookOpen,
    BookPlus,
    Camera,
    Check,
    Ear,
    Headphones,
    Heart,
    House,
    Mic,
    MessageCircle,
    MessageSquareHeart,
    PartyPopper,
    Pause,
    Pencil,
    Play,
    Plus,
    RotateCcw,
    Rocket,
    Send,
    SkipBack,
    SkipForward,
    Smile,
    Sparkles,
    Square,
    Star,
    Trash2,
    UserPlus,
    Users,
    Volume2,
    X,
} from 'lucide-vue-next'
import type { Component } from 'vue'

const ICONS: Record<IconName, Component> = {
    back: ArrowLeft,
    next: ArrowRight,
    book: BookOpen,
    'book-plus': BookPlus,
    camera: Camera,
    check: Check,
    ear: Ear,
    headphones: Headphones,
    heart: Heart,
    home: House,
    mic: Mic,
    message: MessageCircle,
    'message-heart': MessageSquareHeart,
    party: PartyPopper,
    pause: Pause,
    pencil: Pencil,
    play: Play,
    plus: Plus,
    redo: RotateCcw,
    rocket: Rocket,
    send: Send,
    'skip-back': SkipBack,
    'skip-forward': SkipForward,
    smile: Smile,
    sparkles: Sparkles,
    stop: Square,
    star: Star,
    trash: Trash2,
    'user-plus': UserPlus,
    users: Users,
    volume: Volume2,
    close: X,
}

const {
    name,
    size = 22,
    strokeWidth = 2.6,
    motion = 'none',
    isActive = false,
} = defineProps<{ name: IconName; size?: number; strokeWidth?: number; motion?: IconMotion; isActive?: boolean }>()

const icon = computed(() => ICONS[name])
</script>
