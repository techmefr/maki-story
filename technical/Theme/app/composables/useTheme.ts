export const THEME_CHOICES = ['light', 'dark', 'auto'] as const

export type TThemeChoice = (typeof THEME_CHOICES)[number]

const DEVICE_KEY = 'tantara-theme'
const LIGHT_COLOR = '#FFF3DC'
const DARK_COLOR = '#17142B'

const memberKey = (memberId: string): string => `${DEVICE_KEY}:${memberId}`

const isThemeChoice = (value: string | null): value is TThemeChoice => THEME_CHOICES.some(choice => choice === value)

const readStored = (key: string): TThemeChoice | null => {
    try {
        const value = localStorage.getItem(key)
        return isThemeChoice(value) ? value : null
    } catch (_error) {
        return null
    }
}

const writeStored = (key: string, value: TThemeChoice): void => {
    try {
        localStorage.setItem(key, value)
    } catch (_error) {
        return
    }
}

const prefersDark = (): boolean => typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches

export const useTheme = () => {
    const choice = useState<TThemeChoice>('theme-choice', () => 'auto')
    const { currentId } = useCurrentMember()

    const apply = (value: TThemeChoice): void => {
        const resolved = value === 'auto' ? (prefersDark() ? 'dark' : 'light') : value
        document.documentElement.dataset.theme = resolved
        document.documentElement.dataset.themeChoice = value
        document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolved === 'dark' ? DARK_COLOR : LIGHT_COLOR)
    }

    const restore = (): void => {
        const stored = (currentId.value ? readStored(memberKey(currentId.value)) : null) ?? readStored(DEVICE_KEY) ?? 'auto'
        choice.value = stored
        apply(stored)
    }

    const choose = (value: TThemeChoice): void => {
        choice.value = value
        writeStored(DEVICE_KEY, value)
        if (currentId.value) {
            writeStored(memberKey(currentId.value), value)
        }
        apply(value)
    }

    const refresh = (): void => apply(choice.value)

    return { choice, choices: THEME_CHOICES, restore, choose, refresh }
}
