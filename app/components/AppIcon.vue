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
    CloudOff,
    Download,
    Ear,
    Eye,
    Headphones,
    Heart,
    Archive,
    Languages,
    Lock,
    LockOpen,
    House,
    Mic,
    MessageCircle,
    MessageSquareHeart,
    Moon,
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
    TimerOff,
    Trash2,
    UserPlus,
    Users,
    Volume2,
    VolumeX,
    X,
    ZoomIn,
    ZoomOut,
    Maximize,
    RotateCw,
    ChevronDown,
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
    eye: Eye,
    headphones: Headphones,
    heart: Heart,
    chest: Archive,
    languages: Languages,
    lock: Lock,
    unlock: LockOpen,
    home: House,
    mic: Mic,
    message: MessageCircle,
    'message-heart': MessageSquareHeart,
    moon: Moon,
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
    'timer-off': TimerOff,
    trash: Trash2,
    'user-plus': UserPlus,
    users: Users,
    volume: Volume2,
    mute: VolumeX,
    close: X,
    'zoom-in': ZoomIn,
    'zoom-out': ZoomOut,
    maximize: Maximize,
    rotate: RotateCw,
    'chevron-down': ChevronDown,
    download: Download,
    'cloud-off': CloudOff,
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
