<template>
    <div class="reader kid-world" :class="{ 'reader--night on-dark': phase === 'sleep' }" :style="{ background: readerHex }">
        <ChildFoliage />
        <NightCountdown />
        <header class="reader__head">
            <AppButton variant="secondary" is-round to="/kid" :aria-label="t('kid.listen.quit')"><AppIcon name="close" :size="24" /></AppButton>
            <div class="reader__heading"><h1 class="reader__title" :title="bookTitle"><span class="reader__title-text">{{ bookTitle }}</span></h1><div class="reader__segments" role="progressbar" :aria-label="t('kid.listen.progress')" :aria-valuemin="0" :aria-valuemax="pageTotal" :aria-valuenow="phase === 'end' ? pageTotal : pageIndex">
                <span v-for="(_, index) in pageNumbers" :key="index" class="reader__segment" :class="{ 'reader__segment--done': index < pageIndex || phase === 'end', 'reader__segment--current': index === pageIndex }" />
            </div>
            </div>
        </header>
        <div v-if="phase === 'page'" class="reader__center stack center">
            <ChildReadingPage :reader="reader" :is-playing="false" />
            <div class="row">
                <AppButton variant="secondary" class="btn--big" :disabled="pageIndex === 0 || isNavigating" :aria-label="t('kid.listen.previousPage')" data-testid="previous-page" v-sound="'page-turn'" @click="previousPage"><AppIcon name="skip-back" :size="44" class="mirror-rtl" /></AppButton>
                <AppButton class="btn--big reader__next reader__next--ready" :disabled="isNavigating" :aria-label="t('kid.listen.turnPage')" data-testid="turn-page" v-sound="'page-turn'" @click="turnPage"><AppIcon name="next" :size="48" motion="nudge" class="mirror-rtl" /></AppButton>
            </div>
        </div>
        <div v-else-if="phase === 'end'" class="reader__center stack center">
            <MakiScene pose="champion" :size="220" />
            <h1 class="title">{{ t('kid.listen.finished') }}</h1>
            <AppButton variant="secondary" class="btn--big" @click="replay"><AppIcon name="redo" :size="40" motion="spin" />{{ t('kid.listen.restart') }}</AppButton>
            <AppButton to="/kid" class="btn--big"><AppIcon name="home" :size="40" />{{ t('common.back') }}</AppButton>
        </div>
        <div v-else-if="phase === 'loading'" class="reader__center stack center">
            <MakiScene pose="melomane" :size="140" class="anim-pulse" />
        </div>
        <div v-else-if="phase === 'languages'" class="reader__center stack center">
            <AppIcon name="languages" :size="64" motion="float" />
            <h1 class="sr-only">{{ t('playback.chooseTitle') }}</h1>
            <div class="choices" role="group" :aria-label="t('playback.choices')">
                <button
                    v-for="choice in choices"
                    :key="choice.join('-')"
                    type="button"
                    class="choice"
                    :aria-label="choiceLabel(choice)"
                    :data-choice="choice.join('-')"
                    @click="choose(choice)"
                >
                    <FlagIcon :codes="choice" :size="112" aria-hidden="true" />
                </button>
            </div>
        </div>
        <div v-else-if="phase === 'ready'" class="reader__center reader__center--ready stack center">
            <MakiScene pose="reading" :size="180" />

            <div v-if="hasChoice" class="row">
                <button
                    v-if="!isLocked"
                    type="button"
                    class="choice choice--small"
                    :aria-label="t('playback.change')"
                    data-testid="change-language"
                    @click="phase = 'languages'"
                >
                    <FlagIcon :codes="languages ?? []" :size="72" aria-hidden="true" />
                </button>
                <span v-else class="choice choice--small choice--static" data-testid="current-language">
                    <FlagIcon :codes="languages ?? []" :size="72" />
                </span>
                <AppButton variant="secondary" is-round
                    :aria-label="isLocked ? t('playback.unlock') : t('playback.lock')"
                    :aria-pressed="isLocked"
                    data-testid="language-lock"
                    @click="onLockClick">
                    <AppIcon :name="isLocked ? 'lock' : 'unlock'" :size="30" />
                </AppButton>
            </div>
            <div v-if="resumeProgress" class="row">
                <AppButton class="btn--big" :aria-label="t('common.continue')" @click="resume"><AppIcon name="play" :size="56" motion="pulse" /></AppButton>
                <AppButton variant="secondary" class="btn--big" :aria-label="t('kid.listen.fromStart')" @click="start"><AppIcon name="redo" :size="48" motion="spin" /></AppButton>
            </div>
            <AppButton v-else class="btn--big" wiggle :aria-label="t('kid.listen.read')" @click="start"><AppIcon name="play" :size="56" motion="pulse" /></AppButton>
        </div>
        <div v-else-if="phase === 'sleep'" class="reader__center stack center">
            <AppIcon name="moon" :size="140" motion="float" />
            <h1 class="title">{{ t('kid.listen.goodNight') }}</h1>
            <AppButton variant="secondary" to="/kid" class="btn--big"><AppIcon name="home" :size="40" />{{ t('common.back') }}</AppButton>
        </div>
        <div v-else class="reader__center stack center" :class="{ reader__flash: isCueFlashing }">
            <ChildReadingPage :reader="reader" :is-playing="isPlaying" />
            <p v-if="playbackError" class="reader__error" role="alert">{{ playbackError }}</p>
            <div class="row">
                <AppButton variant="secondary" is-round class="btn--big" :disabled="pageIndex === 0 || isNavigating" :aria-label="t('kid.listen.previousPage')" data-testid="previous-page" v-sound="'page-turn'" @click="previousPage">
                    <AppIcon name="skip-back" :size="40" class="mirror-rtl" />
                </AppButton>
                <AppButton variant="secondary" class="btn--big" :disabled="isPlaying" :aria-label="isPlaying ? t('kid.listen.playing') : t('kid.listen.resumePlay')" @click="resumePlayback">
                    <AppIcon :name="isPlaying ? 'volume' : 'play'" :size="48" />
                </AppButton>
                <AppButton variant="secondary" is-round class="btn--big" :disabled="pageIndex >= pageTotal - 1 || isNavigating" :aria-label="t('kid.listen.nextPageShort')" data-testid="skip-page" v-sound="'page-turn'" @click="skipPage">
                    <AppIcon name="skip-forward" :size="40" class="mirror-rtl" />
                </AppButton>
            </div>
        </div>
        <div v-if="isTurning" class="page-turn" data-testid="page-turn" aria-hidden="true" />
        <div class="reader__bottom">
            <div class="progress" role="progressbar" :aria-label="t('kid.listen.progress')" aria-valuemin="0" aria-valuemax="100" :aria-valuenow="progressValue"><div class="progress__fill" :style="{ width: progressPercent, background: '#1E1A3F' }" /></div>
            <div class="row row--wrap" style="justify-content: space-between">
                <AppButton variant="secondary" size="sm" to="/kid"><AppIcon name="close" :size="18" />{{ t('kid.listen.quit') }}</AppButton>
                <AppButton variant="secondary" size="sm" :aria-pressed="isSoundOn" @click="toggleSound">
                    <AppIcon :name="isSoundOn ? 'volume' : 'mute'" :size="18" />{{ isSoundOn ? t('kid.listen.soundOn') : t('kid.listen.soundOff') }}
                </AppButton>
                <AppButton variant="secondary" size="sm"
                    v-if="canSleep"
                    :aria-pressed="sleepTimer.choice.value !== null"
                    :aria-label="t('kid.listen.sleepTimer')"
                    @click="isSleepOpen = true">
                    <AppIcon name="moon" :size="22" :is-active="sleepTimer.choice.value !== null" />
                </AppButton>
                <span class="badge">{{ t('kid.listen.page', { current: formatNumber(pageNumber), total: formatNumber(pageTotal) }) }}</span>
            </div>
        </div>
        <ParentGate
            v-if="isGateOpen"
            :members="members"
            :is-busy="isGateBusy"
            :error-message="gateError"
            :attempt="gateAttempt"
            @submit="unlockWithParent"
            @cancel="isGateOpen = false"
        />
        <SleepSheet
            v-if="isSleepOpen"
            :active="sleepTimer.choice.value"
            @select="chooseSleep"
            @cancel="cancelSleep"
            @close="isSleepOpen = false"
        />
    </div>
</template>

<script setup lang="ts">
import ChildFoliage from '~~/technical/Motion/app/components/ChildFoliage.vue'
const { t, formatNumber } = useI18n()
const { readerHex, phase, reader, isPlaying, pageIndex, pageTotal, isNavigating, previousPage, turnPage, replay, choices, choiceLabel, choose, hasChoice, isLocked, languages, onLockClick, resumeProgress, resume, start, canSleep, sleepTimer, isSleepOpen, isCueFlashing, playbackError, resumePlayback, skipPage, isTurning, progressValue, progressPercent, isSoundOn, toggleSound, pageNumber, pageNumbers, isGateOpen, members, isGateBusy, gateError, gateAttempt, unlockWithParent, chooseSleep, cancelSleep, bookTitle } = useChildReader()
</script>

<style scoped>
.reader__heading { min-width: 0; flex: 1; display: grid; gap: 12px; }
.reader__title-text { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.reader__title { margin: 0; overflow: hidden; overflow-wrap: anywhere; font: 600 clamp(1.125rem, 3vw, 2rem)/1.2 var(--font-title); }
.reader__next--ready { outline: 3px solid #ffdb69; box-shadow: 0 0 0 7px #ffd34a66, 0 0 30px #ffbf00 !important; }
.reader__head { display: flex; gap: 16px; align-items: center; width: 100%; max-width: 1120px; margin-inline: auto; }
.reader__segments { display: flex; flex: 1; gap: 4px; min-width: 0; }
.reader__segment { flex: 1; height: 16px; min-width: 2px; border: 2px solid var(--on-accent); border-radius: 8px; background: var(--paper); }
.reader__segment--done { background: var(--on-accent); }
.reader__segment--current { background: var(--yellow); }
.reader__error { padding: 16px; border-radius: 20px; background: var(--danger-soft); color: var(--on-accent); }

.reader__center > .row {
    justify-content: center;
    flex-wrap: wrap;
}

@media (min-width: 1024px) {
    .reader {
        padding: 32px max(32px, calc((100vw - 960px) / 2));
    }

    .reader__center {
        gap: 24px;
    }
}

@media (max-height: 540px) {
    .reader__center {
        flex: none;
        min-height: min-content;
        padding-block: 16px;
    }

    .reader__center :deep(.scene) {
        max-height: 120px;
    }

    .reader__bottom {
        margin-top: auto;
    }
}

.reader {
    display: flex;
    flex-direction: column;
    position: fixed;
    inset: 0;
    z-index: 40;
    padding: calc(env(safe-area-inset-top) + 16px) 16px calc(env(safe-area-inset-bottom) + 16px);
    overflow-y: auto;
    color: var(--on-accent);
    transition: background 0.3s;
}

.reader--night {
    color: var(--cream);
}

.reader__cover {
    flex: 1;
    min-height: 0;
    width: 100%;
    object-fit: contain;
    border: var(--outline) solid var(--ink);
    border-radius: 18px;
}

.reader__center {
    flex: 1;
    padding-block: 24px;
    display: flex;
    gap: 18px;
    min-height: min-content;
    justify-content: safe center;
}

.reader__bottom {
    width: 100%;
    max-width: 1120px;
    margin-inline: auto;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.reader__flash {
    animation: panel-flash 0.24s ease-out;
}

@keyframes panel-flash {
    from {
        opacity: 0.35;
        transform: scale(0.96);
    }

    to {
        opacity: 1;
        transform: scale(1);
    }
}

@media (prefers-reduced-motion: reduce) {
    .reader__flash {
        animation: none;
    }
}

.page-turn {
    position: fixed;
    inset: 0;
    z-index: 60;
    pointer-events: none;
    background: linear-gradient(100deg, #FFF3DC 0%, #ffe9b3 60%, #1E1A3F22 100%);
    border-inline-start: 3px solid #1E1A3F;
    transform-origin: left center;
    animation: page-turn 0.7s ease-in-out forwards;
}

[dir='rtl'] .page-turn {
    transform-origin: right center;
}

@keyframes page-turn {
    from {
        transform: perspective(1200px) rotateY(0);
        opacity: 1;
    }
    to {
        transform: perspective(1200px) rotateY(-100deg);
        opacity: 0.2;
    }
}

@media (prefers-reduced-motion: reduce) {
    .page-turn {
        display: none;
    }
}

.choices {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 16px;
}

.choice {
    display: inline-flex;
    padding: 10px;
    background: var(--paper);
    color: var(--ink);
    border: 3px solid var(--ink);
    border-radius: 24px;
    box-shadow: 3px 3px 0 #1E1A3F;
    cursor: pointer;
    min-width: 96px;
    min-height: 84px;
    align-items: center;
    justify-content: center;
}

.choice:active:not(.choice--static) {
    transform: translate(3px, 3px);
    box-shadow: 0 0 0 #1E1A3F;
}

.choice--small {
    padding: 6px;
    border-radius: 18px;
}

.choice--static {
    cursor: default;
}
</style>
