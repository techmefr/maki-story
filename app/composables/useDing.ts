const DING_FREQUENCIES = [1318.5, 1760]
const DING_GAP_SECONDS = 0.16
const DING_LENGTH_SECONDS = 1.2

let audioContext: AudioContext | null = null

export const useDing = () => {
    const unlock = (): void => {
        try {
            audioContext = audioContext ?? new AudioContext()
            void audioContext.resume()
        } catch (_error) {
            console.warn('Le son de page ne pourra pas etre joue')
        }
    }

    const ding = (): void => {
        try {
            const context = audioContext ?? new AudioContext()
            audioContext = context
            DING_FREQUENCIES.forEach((frequency, index) => {
                const oscillator = context.createOscillator()
                const gain = context.createGain()
                const start = context.currentTime + index * DING_GAP_SECONDS
                oscillator.type = 'sine'
                oscillator.frequency.value = frequency
                gain.gain.setValueAtTime(0, start)
                gain.gain.linearRampToValueAtTime(0.3, start + 0.01)
                gain.gain.exponentialRampToValueAtTime(0.001, start + DING_LENGTH_SECONDS)
                oscillator.connect(gain)
                gain.connect(context.destination)
                oscillator.start(start)
                oscillator.stop(start + DING_LENGTH_SECONDS + 0.1)
            })
        } catch (_error) {
            console.warn('Le son de page n a pas pu etre joue')
        }
    }

    return { unlock, ding }
}
