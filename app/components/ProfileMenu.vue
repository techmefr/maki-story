<template>
    <div v-if="isOpen && current" class="sheet-backdrop" @click.self="close">
        <div v-sheet="close" class="sheet stack" role="dialog" aria-modal="true" aria-labelledby="profile-menu-title">
            <template v-if="view === 'photo'">
                <h2 id="profile-menu-title" class="subtitle">{{ t('profile.menu.photoTitle') }}</h2>
                <PhotoCapture :frame-color="memberHex(current)" @captured="onCaptured" />
                <p v-if="photoError" class="error" role="alert">{{ photoError }}</p>
                <AppButton variant="secondary" size="sm" @click="view = 'menu'">{{ t('common.cancel') }}</AppButton>
            </template>
            <template v-else>
                <div class="row">
                    <AppAvatar :member="current" :size="64" />
                    <div class="grow">
                        <h2 id="profile-menu-title" class="subtitle">{{ current.name }}</h2>
                        <div class="muted">{{ roleLabel(current.role) }}</div>
                    </div>
                    <AppButton variant="secondary" size="sm" @click="close">{{ t('common.close') }}</AppButton>
                </div>
                <AppButton is-block @click="view = 'photo'">
                    <AppIcon name="camera" :size="22" motion="wiggle" />
                    {{ t('profile.menu.changePhoto') }}
                </AppButton>
                <p v-if="statusMessage" class="muted" role="status">{{ statusMessage }}</p>
                <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
                <section v-if="isChild ? spoken.length > 0 : true" class="stack menu__section" aria-labelledby="menu-spoken">
                    <h3 id="menu-spoken" class="label">{{ t('profile.menu.spokenLanguages') }}</h3>
                    <template v-if="isChild">
                        <ul class="row row--wrap menu__list">
                            <li v-for="language in spokenOptions" :key="language.code" class="badge">
                                <FlagIcon :codes="[language.code]" :size="24" aria-hidden="true" />
                                {{ language.label }}
                            </li>
                        </ul>
                    </template>
                    <template v-else>
                        <p class="muted">{{ t('profile.menu.spokenHint') }}</p>
                        <LanguagePicker v-model="spokenModel" :label="t('profile.menu.spokenLanguages')" :is-disabled="isBusy" />
                    </template>
                </section>
                <section class="stack menu__section" aria-labelledby="menu-text-size">
                    <h3 id="menu-text-size" class="label">{{ t('profile.menu.textSize') }}</h3>
                    <div class="size-picker" role="group" :aria-label="t('profile.menu.textSize')">
                        <button
                            v-for="size in textSizes"
                            :key="size.id"
                            type="button"
                            class="chip"
                            :class="{ 'chip--on': textSizeId === size.id }"
                            :aria-pressed="textSizeId === size.id"
                            :data-text-size="size.id"
                            @click="chooseTextSize(size.id)"
                        >
                            <span class="size-picker__a" aria-hidden="true" :style="{ fontSize: `${16 * size.scale}px` }">A</span>
                            {{ t(`profile.menu.textSizes.${size.id}`) }}
                        </button>
                    </div>
                </section>
                <section v-if="!isChild" class="stack menu__section" aria-labelledby="menu-locale">
                    <h3 id="menu-locale" class="label">{{ t('profile.menu.appLanguage') }}</h3>
                    <div class="row row--wrap" role="group" :aria-label="t('profile.menu.appLanguage')">
                        <button
                            type="button"
                            class="chip menu__chip"
                            :class="{ 'chip--on': preference === null }"
                            :aria-pressed="preference === null"
                            :disabled="isBusy"
                            @click="chooseLocale(null)"
                        >
                            {{ t('profile.menu.automatic') }}
                        </button>
                        <button
                            v-for="language in languages"
                            :key="language.code"
                            type="button"
                            class="chip menu__chip"
                            :class="{ 'chip--on': preference === language.code }"
                            :aria-pressed="preference === language.code"
                            :disabled="isBusy"
                            :lang="language.code"
                            @click="chooseLocale(language.code)"
                        >
                            <FlagIcon :codes="[language.code]" :size="24" aria-hidden="true" />
                            {{ language.label }}
                        </button>
                    </div>
                    <p v-if="isDraft" class="muted menu__draft" role="status">{{ t('profile.menu.draftNotice') }}</p>
                </section>
                <section v-if="current.role === 'parent'" class="stack menu__section" aria-labelledby="menu-password">
                    <h3 id="menu-password" class="label">{{ t('profile.menu.passwordTitle') }}</h3>
                    <form class="stack" @submit.prevent="changePassword">
                        <label class="stack menu__field">
                            <span class="label">{{ t('profile.menu.currentPassword') }}</span>
                            <input v-model="currentPassword" class="input" type="password" autocomplete="current-password" required />
                        </label>
                        <label class="stack menu__field">
                            <span class="label">{{ t('profile.menu.newPassword') }}</span>
                            <input v-model="newPassword" class="input" type="password" autocomplete="new-password" :minlength="PASSWORD_MIN_LENGTH" required />
                        </label>
                        <label class="stack menu__field">
                            <span class="label">{{ t('profile.menu.confirmPassword') }}</span>
                            <input v-model="confirmPassword" class="input" type="password" autocomplete="new-password" required />
                        </label>
                        <p v-if="passwordError" class="error" role="alert">{{ passwordError }}</p>
                        <p v-if="passwordDone" class="muted" role="status">{{ t('profile.menu.passwordDone') }}</p>
                        <AppButton variant="secondary" is-block type="submit" :disabled="isBusy">{{ t('profile.menu.changePassword') }}</AppButton>
                    </form>
                </section>
                <section v-if="current.role === 'parent'" class="stack menu__section" aria-labelledby="menu-ai">
                    <h3 id="menu-ai" class="label">{{ t('profile.menu.ai') }}</h3>
                    <AiQuota />
                </section>
                <section class="stack menu__section" aria-labelledby="menu-sounds">
                    <h3 id="menu-sounds" class="label">{{ t('profile.menu.sounds') }}</h3>
                    <AppToggle :model-value="isCueOn" @update:model-value="setCueOn">{{ t('profile.menu.soundsOn') }}</AppToggle>
                    <div class="stack menu__field">
                        <span id="sound-volume-label" class="label">{{ t('profile.menu.soundsVolume') }}</span>
                        <AppSlider
                            :model-value="cueVolume"
                            aria-labelledby="sound-volume-label"
                            start-icon="mute"
                            end-icon="volume"
                            :disabled="!isCueOn"
                            @update:model-value="setCueVolume"
                        />
                    </div>
                    <AppToggle :model-value="isLearningFont" data-testid="learning-font" @update:model-value="setLearningFont">{{ t('profile.menu.learningFont') }}</AppToggle>
                </section>
                <AppButton variant="secondary" is-block @click="openSwitcher">{{ t('profile.switchProfile') }}</AppButton>
            </template>
        </div>
    </div>
</template>

<script setup lang="ts">
const PASSWORD_MIN_LENGTH = 8

const { t, isDraft } = useI18n()
const isOpen = useState<boolean>('profile-menu-open', () => false)
const isSwitcherOpen = useState<boolean>('switcher-open', () => false)
const { current, isChild } = useCurrentMember()
const { updateSettings, changePhoto } = useMembers()
const { request } = useApi()
const { isCueOn, cueVolume, setCueOn, setCueVolume, play } = useSoundCues()
const { languages, preference, setLocale, syncLocale } = useLocale()
const { isLearningFont, setLearningFont } = useLearningFont()
const { sizeId: textSizeId, sizes: textSizes, choose: chooseTextSize } = useTextSize()

const view = ref<'menu' | 'photo'>('menu')
const isBusy = ref(false)
const statusMessage = ref('')
const errorMessage = ref('')
const photoError = ref('')
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const passwordError = ref('')
const passwordDone = ref(false)

const spoken = computed(() => current.value?.spokenLanguages ?? [])
const spokenOptions = computed(() => languages.filter(language => spoken.value.includes(language.code)))

const reset = (): void => {
    view.value = 'menu'
    statusMessage.value = ''
    errorMessage.value = ''
    photoError.value = ''
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
    passwordError.value = ''
    passwordDone.value = false
}

const close = (): void => {
    isOpen.value = false
    reset()
}

const openSwitcher = (): void => {
    close()
    isSwitcherOpen.value = true
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

const spokenModel = computed({
    get: () => spoken.value,
    set: (value: string[]) => {
        if (current.value) {
            void run(() => updateSettings(current.value!.id, { spokenLanguages: value }))
        }
    },
})

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

const changePassword = async (): Promise<void> => {
    passwordError.value = ''
    passwordDone.value = false
    if (newPassword.value.length < PASSWORD_MIN_LENGTH) {
        passwordError.value = t('profile.menu.passwordTooShort', { min: PASSWORD_MIN_LENGTH })
        return
    }
    if (newPassword.value !== confirmPassword.value) {
        passwordError.value = t('profile.menu.passwordMismatch')
        return
    }
    if (newPassword.value === currentPassword.value) {
        passwordError.value = t('profile.menu.passwordSame')
        return
    }
    isBusy.value = true
    try {
        await request('/auth/password', { method: 'PUT', body: { currentPassword: currentPassword.value, newPassword: newPassword.value } })
        currentPassword.value = ''
        newPassword.value = ''
        confirmPassword.value = ''
        passwordDone.value = true
    } catch (error) {
        const status = (error as { statusCode?: number }).statusCode
        passwordError.value =
            status === 403
                ? t('profile.menu.passwordWrong')
                : status === 429
                  ? t('profile.menu.passwordThrottled')
                  : t('profile.menu.passwordFailed')
    } finally {
        isBusy.value = false
    }
}
</script>

<style scoped>
.menu__section {
    border-top: 2.5px solid var(--ink);
    padding-top: 14px;
}

.menu__list {
    list-style: none;
    padding: 0;
    margin: 0;
}

.menu__chip {
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
}

.menu__field {
    gap: 6px;
}
</style>
