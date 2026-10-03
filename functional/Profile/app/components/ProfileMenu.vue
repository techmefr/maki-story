<template>
    <div v-if="isOpen && current" class="sheet-backdrop" @click.self="close">
        <div v-sheet="close" class="sheet stack pmenu" role="dialog" aria-modal="true" aria-labelledby="profile-menu-title">
            <template v-if="view === 'photo'">
                <h2 id="profile-menu-title" class="subtitle">{{ t('profile.menu.photoTitle') }}</h2>
                <PhotoCapture :frame-color="memberHex(current)" @captured="onCaptured" />
                <p v-if="photoError" class="error" role="alert">{{ photoError }}</p>
                <AppButton variant="secondary" size="sm" icon="back" @click="view = 'menu'">{{ t('common.cancel') }}</AppButton>
            </template>
            <template v-else>
                <div class="row pmenu__head">
                    <AppAvatar :member="current" :size="64" />
                    <div class="grow">
                        <h2 id="profile-menu-title" class="pmenu__name">{{ current.name }}</h2>
                        <div class="pmenu__role">
                            {{ roleLabel(current.role) }} ·
                            <button type="button" class="pmenu__photo" @click="view = 'photo'">
                                <AppIcon name="camera" :size="16" />{{ t('profile.menu.changePhoto') }}
                            </button>
                        </div>
                    </div>
                    <AppIconButton icon="close" :label="t('common.close')" data-testid="settings-close" @click="close" />
                </div>
                <p v-if="statusMessage" class="pmenu__status" role="status">{{ statusMessage }}</p>
                <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
                <div class="stack pmenu__list">
                    <ProfileMenuSection
                        v-if="!isChild || spoken.length > 0"
                        :label="t('profile.menu.spokenLanguages')"
                        :value="t('profile.menu.chosenCount', { count: spoken.length })"
                        :is-open="openId === 'spoken'"
                        @toggle="toggleSection('spoken')"
                    >
                        <ul v-if="isChild" class="row row--wrap pmenu__readonly">
                            <li v-for="language in spokenOptions" :key="language.code" class="badge">
                                <FlagIcon :codes="[language.code]" :size="24" aria-hidden="true" />
                                {{ language.label }}
                            </li>
                        </ul>
                        <template v-else>
                            <p class="pmenu__hint">{{ t('profile.menu.spokenHint') }}</p>
                            <div class="row row--wrap" role="group" :aria-label="t('profile.menu.spokenLanguages')">
                                <ProfileChip
                                    v-for="language in spokenChoices"
                                    :key="language.code"
                                    :selected="spoken.includes(language.code)"
                                    :disabled="isBusy"
                                    :lang="language.code"
                                    @click="toggleSpoken(language.code)"
                                >
                                    <FlagIcon :codes="[language.code]" :size="26" aria-hidden="true" />
                                    {{ language.label }}
                                </ProfileChip>
                            </div>
                        </template>
                    </ProfileMenuSection>
                    <ProfileMenuSection
                        :label="t('profile.menu.appLanguage')"
                        :value="localeLabel"
                        :is-open="openId === 'locale'"
                        @toggle="toggleSection('locale')"
                    >
                        <div class="row row--wrap" role="group" :aria-label="t('profile.menu.appLanguage')">
                            <ProfileChip :selected="preference === null" :disabled="isBusy" @click="chooseLocale(null)">
                                {{ t('profile.menu.automatic') }}
                            </ProfileChip>
                            <ProfileChip
                                v-for="language in languages"
                                :key="language.code"
                                :selected="preference === language.code"
                                :disabled="isBusy"
                                :lang="language.code"
                                @click="chooseLocale(language.code)"
                            >
                                <FlagIcon :codes="[language.code]" :size="26" aria-hidden="true" />
                                {{ language.label }}
                            </ProfileChip>
                        </div>
                        <p v-if="isDraft" class="pmenu__hint menu__draft" role="status">{{ t('profile.menu.draftNotice') }}</p>
                    </ProfileMenuSection>
                    <ProfileMenuSection
                        :label="t('profile.menu.textSize')"
                        :value="t(`profile.menu.textSizes.${textSizeId}`)"
                        :is-open="openId === 'size'"
                        @toggle="toggleSection('size')"
                    >
                        <div class="row row--wrap" role="group" :aria-label="t('profile.menu.textSize')">
                            <ProfileChip
                                v-for="size in textSizes"
                                :key="size.id"
                                :selected="textSizeId === size.id"
                                :data-text-size="size.id"
                                @click="chooseTextSize(size.id)"
                            >
                                {{ t(`profile.menu.textSizes.${size.id}`) }}
                            </ProfileChip>
                        </div>
                        <AppToggle :model-value="isLearningFont" data-testid="learning-font" @update:model-value="setLearningFont">
                            {{ t('profile.menu.learningFont') }}
                        </AppToggle>
                    </ProfileMenuSection>
                    <ProfileMenuSection
                        :label="t('profile.menu.theme')"
                        :value="t(`profile.menu.themes.${themeChoice}`)"
                        :is-open="openId === 'theme'"
                        data-testid="settings-theme"
                        @toggle="toggleSection('theme')"
                    >
                        <div class="row row--wrap" role="group" :aria-label="t('profile.menu.theme')">
                            <ProfileChip
                                v-for="option in themeOptions"
                                :key="option.id"
                                :selected="themeChoice === option.id"
                                :data-theme-choice="option.id"
                                @click="chooseTheme(option.id)"
                            >
                                <AppIcon :name="option.icon" :size="20" />
                                {{ t(`profile.menu.themes.${option.id}`) }}
                            </ProfileChip>
                        </div>
                    </ProfileMenuSection>
                    <ProfileMenuSection
                        v-if="!isChild"
                        :label="t('profile.menu.notifications')"
                        :is-open="openId === 'notifications'"
                        @toggle="toggleSection('notifications')"
                    >
                        <ProfileNotificationPrefs v-if="openedOnce.has('notifications')" />
                    </ProfileMenuSection>
                    <div class="pmenu__sounds">
                        <AppToggle :model-value="isCueOn" data-testid="sound-toggle" @update:model-value="setCueOn">{{ t('profile.menu.sounds') }}</AppToggle>
                        <AppSlider
                            v-if="isCueOn"
                            :model-value="cueVolume"
                            :aria-label="t('profile.menu.soundsVolume')"
                            start-icon="mute"
                            end-icon="volume"
                            @update:model-value="setCueVolume"
                        />
                    </div>
                    <section v-if="isAiCreationEnabled && current.role === 'parent'" class="pmenu__ai" aria-labelledby="menu-ai">
                        <h3 id="menu-ai" class="pmenu__subhead">{{ t('profile.menu.ai') }}</h3>
                        <AiQuota />
                    </section>
                </div>
                <AppButton v-if="!isChild" variant="secondary" tone="mint" icon="pencil" is-block to="/profile/edit" data-testid="profile-edit-open" @click="close">
                    {{ t('profile.menu.edit') }}
                </AppButton>
                <AppButton v-if="current.role === 'parent'" variant="secondary" tone="grape" icon="moon" is-block to="/family/parental" data-testid="parental-open" @click="close">
                    {{ t('profile.menu.schedule') }}
                </AppButton>
                <AppButton variant="secondary" icon="users" is-block data-testid="profile-switch" @click="openSwitcher">{{ t('profile.switchProfile') }}</AppButton>
                <AppButton v-if="!isChild" variant="secondary" icon="logout" is-block class="pmenu__quit" data-testid="profile-quit" @click="quit">
                    {{ t('profile.menu.quit') }}
                </AppButton>
                <div v-if="!isChild" class="pmenu__feedback">
                    <AppButton variant="tertiary" icon="smile" data-testid="feedback-open" @click="openFeedback">{{ t('profile.menu.feedback') }}</AppButton>
                </div>
            </template>
        </div>
    </div>
</template>

<script setup lang="ts">
type TSectionId = 'spoken' | 'locale' | 'size' | 'theme' | 'notifications'

const THEME_OPTIONS: { id: TThemeChoice; icon: IconName }[] = [
    { id: 'light', icon: 'sun' },
    { id: 'dark', icon: 'moon' },
    { id: 'auto', icon: 'auto' },
]

const isAiCreationEnabled = useAiCreationEnabled()
const { t, isDraft } = useI18n()
const isOpen = useState<boolean>('profile-menu-open', () => false)
const isSwitcherOpen = useState<boolean>('switcher-open', () => false)
const isFeedbackOpen = useState<boolean>('feedback-open', () => false)
const requestedView = useState<'menu' | 'photo'>('profile-menu-view', () => 'menu')
const { current, isChild, select } = useCurrentMember()
const { updateSettings, changePhoto } = useMembers()
const { logout } = useSession()
const { isCueOn, cueVolume, setCueOn, setCueVolume, play } = useSoundCues()
const { languages, preference, setLocale, syncLocale } = useLocale()
const { isLearningFont, setLearningFont } = useLearningFont()
const { sizeId: textSizeId, sizes: textSizes, choose: chooseTextSize } = useTextSize()
const { choice: themeChoice, choose: chooseTheme } = useTheme()
const { optionsFor } = useFamilyLanguages()

const themeOptions = THEME_OPTIONS
const view = ref<'menu' | 'photo'>('menu')
const openId = ref<TSectionId | null>(null)
const openedOnce = ref(new Set<TSectionId>())
const isBusy = ref(false)
const statusMessage = ref('')
const errorMessage = ref('')
const photoError = ref('')

const spoken = computed(() => current.value?.spokenLanguages ?? [])
const spokenOptions = computed(() => languages.filter(language => spoken.value.includes(language.code)))
const spokenChoices = computed(() => optionsFor(spoken.value))
const localeLabel = computed(() => languages.find(language => language.code === preference.value)?.label ?? t('profile.menu.automatic'))

watch(isOpen, value => {
    if (value) {
        view.value = requestedView.value
        requestedView.value = 'menu'
    }
})

const toggleSection = (id: TSectionId): void => {
    openId.value = openId.value === id ? null : id
    if (openId.value !== null) {
        openedOnce.value.add(openId.value)
    }
}

const reset = (): void => {
    view.value = 'menu'
    openId.value = null
    statusMessage.value = ''
    errorMessage.value = ''
    photoError.value = ''
}

const close = (): void => {
    isOpen.value = false
    reset()
}

const openSwitcher = (): void => {
    close()
    isSwitcherOpen.value = true
}

const openFeedback = (): void => {
    close()
    isFeedbackOpen.value = true
}

const quit = async (): Promise<void> => {
    close()
    await select(null)
    await logout()
}

const run = async (action: () => Promise<void>): Promise<void> => {
    isBusy.value = true
    statusMessage.value = ''
    errorMessage.value = ''
    try {
        await action()
        statusMessage.value = t('common.saved')
        play('success')
    } catch (error) {
        console.error('Le réglage n a pas pu être enregistré', error)
        errorMessage.value = t('profile.menu.saveError')
        play('error')
    } finally {
        isBusy.value = false
    }
}

const toggleSpoken = (code: string): Promise<void> => {
    const member = current.value
    if (!member) {
        return Promise.resolve()
    }
    const next = spoken.value.includes(code) ? spoken.value.filter(item => item !== code) : [...spoken.value, code]
    return run(() => updateSettings(member.id, { spokenLanguages: next }))
}

const chooseLocale = (code: string | null): Promise<void> =>
    run(async () => {
        await setLocale(code)
        await syncLocale()
    })

const onCaptured = async (blob: Blob): Promise<void> => {
    if (!current.value) {
        return
    }
    photoError.value = ''
    try {
        await changePhoto(current.value.id, blob)
        view.value = 'menu'
        statusMessage.value = t('profile.menu.photoChanged')
    } catch (error) {
        console.error('La photo n a pas pu être envoyée', error)
        photoError.value = t('profile.menu.photoError')
    }
}
</script>

<style scoped>
.pmenu {
    gap: 14px;
}

.pmenu__head {
    gap: 14px;
}

.pmenu__name {
    margin: 0;
    font: 700 1.375rem/1.1 var(--font-title);
    overflow-wrap: anywhere;
}

.pmenu__role {
    color: var(--ink-soft);
    font: 500 1rem/1.3 var(--font-body);
}

.pmenu__photo {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 44px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ink);
    font: 700 1rem/1.3 var(--font-body);
    text-decoration: underline;
    text-underline-offset: 3px;
    cursor: pointer;
}

.pmenu__status {
    margin: 0;
    color: var(--ink-soft);
    font: 700 0.9375rem/1.3 var(--font-body);
}

.pmenu__list {
    gap: 10px;
    margin-top: 6px;
}

.pmenu__hint {
    margin: 0;
    color: var(--ink-soft);
    font: 500 0.9375rem/1.3 var(--font-body);
}

.pmenu__readonly {
    margin: 0;
    padding: 0;
    list-style: none;
}

.pmenu__sounds {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 14px 16px;
    border: var(--outline) solid var(--ink);
    border-radius: 22px;
    background: var(--paper);
}

.pmenu__sounds :deep(.toggle) {
    width: 100%;
    justify-content: space-between;
    flex-direction: row-reverse;
    font: 700 1.125rem/1.2 var(--font-title);
}

.pmenu__ai {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 14px 16px;
    border: var(--outline) solid var(--ink);
    border-radius: 22px;
    background: var(--paper);
}

.pmenu__subhead {
    margin: 0;
    font: 700 1.125rem/1.2 var(--font-title);
}

.pmenu__quit {
    background: var(--danger-soft);
}

.pmenu__feedback {
    display: flex;
    justify-content: center;
    font-weight: 700;
}
</style>
