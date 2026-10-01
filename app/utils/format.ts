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

export const formatBytes = (bytes: number): string => {
    const { t, formatNumber } = useI18n()
    const oneDecimal = { maximumFractionDigits: 1, minimumFractionDigits: 1 }
    if (bytes < 1024) {
        return t('shell.bytes.b', { value: formatNumber(bytes) })
    }
    if (bytes < 1024 * 1024) {
        return t('shell.bytes.kb', { value: formatNumber(Math.round(bytes / 1024)) })
    }
    if (bytes < 1024 * 1024 * 1024) {
        return t('shell.bytes.mb', { value: formatNumber(bytes / (1024 * 1024), oneDecimal) })
    }
    return t('shell.bytes.gb', { value: formatNumber(bytes / (1024 * 1024 * 1024), oneDecimal) })
}
