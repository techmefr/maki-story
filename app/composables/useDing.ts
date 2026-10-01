const DING_FREQUENCIES = [1318.5, 1760]
const DING_GAP_SECONDS = 0.16
const DING_LENGTH_SECONDS = 1.2
const DING_VOLUME = 0.3
const CUE_FREQUENCY = 988
const CUE_LENGTH_SECONDS = 0.28
const CUE_VOLUME = 0.12
const CUE_FLASH_MS = 240

let audioContext: AudioContext | null = null

export const useDing = () => {
    const { isSoundOn } = useSoundSetting()
    const isCueFlashing = ref(false)

    const unlock = (): void => {
        try {
            audioContext = audioContext ?? new AudioContext()
            void audioContext.resume()
        } catch (_error) {
            console.warn('Le son de page ne pourra pas etre joue')
        }
    }

    const playTone = (frequency: number, delay: number, length: number, volume: number): void => {
        const context = audioContext ?? new AudioContext()
        audioContext = context
        const oscillator = context.createOscillator()
        const gain = context.createGain()
        const start = context.currentTime + delay
        oscillator.type = 'sine'
        oscillator.frequency.value = frequency
        gain.gain.setValueAtTime(0, start)
        gain.gain.linearRampToValueAtTime(volume, start + 0.01)
        gain.gain.exponentialRampToValueAtTime(0.001, start + length)
        oscillator.connect(gain)
        gain.connect(context.destination)
        oscillator.start(start)
        oscillator.stop(start + length + 0.1)
    }

    const ding = (): void => {
        if (!isSoundOn.value) {
            return
        }
        try {
            DING_FREQUENCIES.forEach((frequency, index) => {
                playTone(frequency, index * DING_GAP_SECONDS, DING_LENGTH_SECONDS, DING_VOLUME)
            })
        } catch (_error) {
            console.warn('Le son de page n a pas pu etre joue')
        }
    }

    const panelCue = (): void => {
        const isMotionReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        if (!isMotionReduced) {
            isCueFlashing.value = true
            setTimeout(() => {
                isCueFlashing.value = false
            }, CUE_FLASH_MS)
        }
        if (!isSoundOn.value) {
            return
        }
        try {
            playTone(CUE_FREQUENCY, 0, CUE_LENGTH_SECONDS, CUE_VOLUME)
        } catch (_error) {
            console.warn('Le son de case n a pas pu etre joue')
        }
    }

    return { unlock, ding, panelCue, isCueFlashing }
}
