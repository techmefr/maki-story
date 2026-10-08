import { Capacitor } from '@capacitor/core'

const SPEECH_RATE = 0.95
const VOICES_TIMEOUT_MS = 1500

const baseOf = (code: string): string => code.toLowerCase().split(/[-_]/)[0] ?? ''

const isWebSpeechAvailable = (): boolean =>
    typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined'

const loadWebVoices = (): Promise<SpeechSynthesisVoice[]> => {
    return new Promise(resolve => {
        const synth = window.speechSynthesis
        if (synth.getVoices().length > 0) {
            resolve(synth.getVoices())
            return
        }
        const finish = (): void => {
            synth.removeEventListener('voiceschanged', onChange)
            window.clearTimeout(timer)
            resolve(synth.getVoices())
        }
        const onChange = (): void => {
            if (synth.getVoices().length > 0) {
                finish()
            }
        }
        const timer = window.setTimeout(finish, VOICES_TIMEOUT_MS)
        synth.addEventListener('voiceschanged', onChange)
    })
}

const speakOnWeb = async (text: string, language: string, isStale: () => boolean): Promise<boolean> => {
    if (!isWebSpeechAvailable()) {
        return false
    }
    const voices = await loadWebVoices()
    const voice = voices.find(item => baseOf(item.lang) === baseOf(language))
    if (!voice) {
        return false
    }
    if (isStale()) {
        return true
    }
    await new Promise<void>(resolve => {
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.voice = voice
        utterance.lang = voice.lang
        utterance.rate = SPEECH_RATE
        utterance.onend = () => resolve()
        utterance.onerror = () => resolve()
        window.speechSynthesis.speak(utterance)
    })
    return true
}

const speakNatively = async (text: string, language: string, isStale: () => boolean): Promise<boolean | null> => {
    try {
        const { TextToSpeech } = await import('@capacitor-community/text-to-speech')
        const { supported } = await TextToSpeech.isLanguageSupported({ lang: language })
        if (!supported) {
            return false
        }
        if (!isStale()) {
            await TextToSpeech.speak({ text, lang: language, rate: SPEECH_RATE })
        }
        return true
    } catch (_error) {
        return null
    }
}

export const useLineVoice = () => {
    const speakingId = useState<string | null>('line-voice-speaking-id', () => null)
    let generation = 0

    const stop = (): void => {
        generation += 1
        speakingId.value = null
        if (isWebSpeechAvailable()) {
            window.speechSynthesis.cancel()
        }
        if (Capacitor.isNativePlatform()) {
            void import('@capacitor-community/text-to-speech').then(({ TextToSpeech }) => TextToSpeech.stop()).catch(() => undefined)
        }
    }

    const speak = async (id: string, text: string, language: string): Promise<boolean> => {
        stop()
        const token = generation
        const isStale = (): boolean => token !== generation
        speakingId.value = id
        let hasVoice: boolean | null = null
        if (Capacitor.isNativePlatform()) {
            hasVoice = await speakNatively(text, language, isStale)
        }
        if (hasVoice === null) {
            hasVoice = await speakOnWeb(text, language, isStale)
        }
        if (!isStale()) {
            speakingId.value = null
        }
        return hasVoice
    }

    onBeforeUnmount(() => {
        if (speakingId.value !== null) {
            stop()
        }
    })

    return { speakingId, speak, stop }
}
