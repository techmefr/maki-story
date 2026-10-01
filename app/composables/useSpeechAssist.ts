export type SpeechCategory = 'dialogue' | 'tone' | 'scene'

export interface ISpeechParts {
    dialogue: string
    tone: string
    scene: string
}

const SPEECH_RATE = 0.95

export const useSpeechAssist = () => {
    const isAvailable = ref(false)
    const isEnabled = ref(false)
    const isSpeaking = ref(false)
    const categories = reactive<Record<SpeechCategory, boolean>>({ dialogue: true, tone: true, scene: true })
    let generation = 0

    const cancel = (): void => {
        generation += 1
        isSpeaking.value = false
        if (isAvailable.value) {
            window.speechSynthesis.cancel()
        }
    }

    const speakOne = (text: string, language: string, token: number): Promise<void> => {
        return new Promise(resolve => {
            const utterance = new SpeechSynthesisUtterance(text)
            utterance.lang = language
            utterance.rate = SPEECH_RATE
            utterance.onend = () => resolve()
            utterance.onerror = () => resolve()
            if (token === generation) {
                window.speechSynthesis.speak(utterance)
            } else {
                resolve()
            }
        })
    }

    const speak = async (parts: ISpeechParts, language: string): Promise<void> => {
        if (!isAvailable.value) {
            return
        }
        cancel()
        const token = generation
        const queue = (['scene', 'tone', 'dialogue'] as SpeechCategory[])
            .filter(category => categories[category] && parts[category].trim().length > 0)
            .map(category => parts[category])
        isSpeaking.value = queue.length > 0
        for (const text of queue) {
            if (token !== generation) {
                return
            }
            await speakOne(text, language, token)
        }
        if (token === generation) {
            isSpeaking.value = false
        }
    }

    const toggle = (): void => {
        isEnabled.value = !isEnabled.value
        if (!isEnabled.value) {
            cancel()
        }
    }

    const toggleCategory = (category: SpeechCategory): void => {
        categories[category] = !categories[category]
    }

    onMounted(() => {
        isAvailable.value = typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined'
    })

    onBeforeUnmount(cancel)

    return { isAvailable, isEnabled, isSpeaking, categories, speak, cancel, toggle, toggleCategory }
}
