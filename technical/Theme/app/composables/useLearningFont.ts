const KEY = 'tantara-learning-font'

const readStored = (): boolean => {
    try {
        return localStorage.getItem(KEY) === 'on'
    } catch (_error) {
        return false
    }
}

export const useLearningFont = () => {
    const isLearningFont = useState<boolean>('learning-font', () => false)

    const apply = (value: boolean): void => {
        document.documentElement.dataset.learningFont = value ? 'on' : 'off'
    }

    const restore = (): void => {
        isLearningFont.value = readStored()
        apply(isLearningFont.value)
    }

    const setLearningFont = (value: boolean): void => {
        isLearningFont.value = value
        apply(value)
        try {
            localStorage.setItem(KEY, value ? 'on' : 'off')
        } catch (_error) {
            return
        }
    }

    return { isLearningFont, restore, setLearningFont }
}
