interface ICueSettings {
    isOn: boolean
    volume: number
}

interface ICueWindow {
    __soundCues?: SoundCue[]
}

const STORAGE_PREFIX = 'tantara-cues-'
const LOG_LIMIT = 100

let audioContext: AudioContext | null = null

const storageKey = (memberId: string | null): string => `${STORAGE_PREFIX}${memberId ?? 'none'}`

export const useSoundCues = () => {
    const { current, isChild } = useCurrentMember()
    const stored = useState<ICueSettings | null>('sound-cues-settings', () => null)
    const busySources = useState<Record<string, boolean>>('sound-cues-busy', () => ({}))
    const loadedFor = useState<string | null>('sound-cues-loaded-for', () => null)

    const defaults = (): ICueSettings => ({ isOn: isChild.value, volume: DEFAULT_CUE_VOLUME })

    const load = (): void => {
        if (!import.meta.client) {
            return
        }
        const id = current.value?.id ?? null
        if (loadedFor.value === id && stored.value) {
            return
        }
        loadedFor.value = id
        try {
            const raw = localStorage.getItem(storageKey(id))
            const parsed = raw ? (JSON.parse(raw) as Partial<ICueSettings>) : null
            stored.value = parsed
                ? { isOn: parsed.isOn ?? defaults().isOn, volume: clampVolume(parsed.volume ?? DEFAULT_CUE_VOLUME) }
                : defaults()
        } catch (_error) {
            stored.value = defaults()
        }
    }

    const settings = computed<ICueSettings>(() => {
        load()
        return stored.value ?? defaults()
    })

    const isCueOn = computed(() => settings.value.isOn)
    const cueVolume = computed(() => settings.value.volume)

    const save = (next: ICueSettings): void => {
        stored.value = next
        try {
            localStorage.setItem(storageKey(current.value?.id ?? null), JSON.stringify(next))
        } catch (_error) {
            console.warn('Le réglage des sons n a pas pu être gardé')
        }
    }

    const setCueOn = (value: boolean): void => save({ ...settings.value, isOn: value })
    const setCueVolume = (value: number): void => save({ ...settings.value, volume: clampVolume(value) })

    const setBusy = (source: string, value: boolean): void => {
        busySources.value = { ...busySources.value, [source]: value }
    }

    const isBusy = (): boolean => Object.values(busySources.value).some(Boolean)

    const unlock = (): void => {
        if (navigator.webdriver) {
            return
        }
        try {
            audioContext = audioContext ?? new AudioContext()
            void audioContext.resume()
        } catch (_error) {
            console.warn('Les sons d interface ne pourront pas être joués')
        }
    }

    const play = (cue: SoundCue): void => {
        load()
        if (!settings.value.isOn || isBusy()) {
            return
        }
        const cueWindow = window as unknown as ICueWindow
        cueWindow.__soundCues = [...(cueWindow.__soundCues ?? []), cue].slice(-LOG_LIMIT)
        document.documentElement.dataset.lastSoundCue = cue
        if (navigator.webdriver) {
            return
        }
        try {
            unlock()
            if (audioContext) {
                synthesizeCue(audioContext, cue, settings.value.volume)
            }
        } catch (_error) {
            console.warn('Le son d interface n a pas pu être joué')
        }
    }

    return { isCueOn, cueVolume, setCueOn, setCueVolume, setBusy, play, unlock }
}
