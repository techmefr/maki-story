export const useAudioPlayer = () => {
    const { fetchUrl } = useFiles()
    const isPlaying = ref(false)
    const positionMs = ref(0)
    const rate = ref(1)
    let audio: HTMLAudioElement | null = null
    let endedHandler: (() => void) | null = null

    const ensureAudio = (): HTMLAudioElement => {
        if (audio) {
            return audio
        }
        audio = new Audio()
        audio.preload = 'auto'
        audio.addEventListener('timeupdate', () => {
            positionMs.value = Math.round((audio?.currentTime ?? 0) * 1000)
        })
        audio.addEventListener('ended', () => {
            isPlaying.value = false
            endedHandler?.()
        })
        audio.addEventListener('pause', () => {
            isPlaying.value = false
        })
        audio.addEventListener('playing', () => {
            isPlaying.value = true
        })
        return audio
    }

    const unlock = (): void => {
        ensureAudio()
    }

    const onEnded = (handler: () => void): void => {
        endedHandler = handler
    }

    const play = async (fileId: string, startMs = 0): Promise<boolean> => {
        try {
            const element = ensureAudio()
            element.src = await fetchUrl(fileId)
            element.playbackRate = rate.value
            element.currentTime = startMs / 1000
            positionMs.value = startMs
            await element.play()
            return true
        } catch (error) {
            console.error('La lecture de ce son n a pas pu demarrer', error)
            isPlaying.value = false
            return false
        }
    }

    const pause = (): void => {
        audio?.pause()
    }

    const resume = async (): Promise<void> => {
        try {
            await audio?.play()
        } catch (error) {
            console.error('La lecture n a pas pu reprendre', error)
        }
    }

    const stop = (): void => {
        if (!audio) {
            return
        }
        audio.pause()
        audio.removeAttribute('src')
        audio.load()
        positionMs.value = 0
        isPlaying.value = false
    }

    const setVolume = (value: number): void => {
        if (audio) {
            audio.volume = Math.min(1, Math.max(0, value))
        }
    }

    const setRate = (value: number): void => {
        rate.value = value
        if (audio) {
            audio.playbackRate = value
        }
    }

    const FADE_STEPS = 10
    let fadeTimer: ReturnType<typeof setInterval> | null = null

    const fadeOut = (): void => {
        if (!audio || audio.paused || fadeTimer !== null) {
            return
        }
        const startVolume = audio.volume
        let step = 0
        fadeTimer = setInterval(() => {
            step += 1
            setVolume(startVolume * (1 - step / FADE_STEPS))
            if (step >= FADE_STEPS) {
                clearInterval(fadeTimer ?? undefined)
                fadeTimer = null
                pause()
                setVolume(startVolume)
            }
        }, ACCESS_FADE_MS / FADE_STEPS)
    }

    if (import.meta.client) {
        window.addEventListener(ACCESS_CLOSING_EVENT, fadeOut)
    }

    onBeforeUnmount(() => {
        if (import.meta.client) {
            window.removeEventListener(ACCESS_CLOSING_EVENT, fadeOut)
        }
        if (fadeTimer !== null) {
            clearInterval(fadeTimer)
        }
        stop()
        endedHandler = null
        audio = null
    })

    return { isPlaying, positionMs, rate, unlock, onEnded, play, pause, resume, stop, setRate, setVolume }
}
