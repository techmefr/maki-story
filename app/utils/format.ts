export const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000)
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

export const pickVoiceByText = (text: string): IVoiceColor => {
    return VOICE_COLORS[hashText(text) % VOICE_COLORS.length] ?? getVoiceColor('coral')
}

export const initialOf = (name: string): string => name.trim().charAt(0).toUpperCase()

export const hashText = (text: string): number => {
    let hash = 0
    for (const char of text) {
        hash = (hash * 31 + char.charCodeAt(0)) >>> 0
    }
    return hash
}
