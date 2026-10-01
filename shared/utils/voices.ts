export const VOICE_COLORS: IVoiceColor[] = [
    { id: 'coral', hex: '#FF7A6B', hexLight: '#FF968A' },
    { id: 'sun', hex: '#FFC940', hexLight: '#FFD76E' },
    { id: 'mint', hex: '#4CD4A8', hexLight: '#72DEBB' },
    { id: 'sky', hex: '#6BB6FF', hexLight: '#8CC6FF' },
    { id: 'grape', hex: '#B08CFF', hexLight: '#C3A6FF' },
    { id: 'pink', hex: '#FF94C8', hexLight: '#FFAED5' },
]

const FALLBACK_VOICE: IVoiceColor = { id: 'coral', hex: '#FF7A6B', hexLight: '#FF968A' }

export const INK_COLOR = '#1F1B3A'
export const CREAM_COLOR = '#FFF4D9'
export const MAX_MESSAGES_PER_CONVERSATION = 5
export const MAX_STATUS_MESSAGES_PER_RELATIVE = 3

export const getVoiceColor = (id: VoiceColorId): IVoiceColor => {
    return VOICE_COLORS.find(color => color.id === id) ?? FALLBACK_VOICE
}
