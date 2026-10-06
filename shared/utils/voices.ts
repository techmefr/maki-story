export const VOICE_COLORS: IVoiceColor[] = [
    { id: 'coral', hex: '#FF7766', hexLight: '#FF968A' },
    { id: 'sun', hex: '#FFC933', hexLight: '#FFD76E' },
    { id: 'mint', hex: '#4AD3A5', hexLight: '#72DEBB' },
    { id: 'sky', hex: '#6DB5FF', hexLight: '#8CC6FF' },
    { id: 'grape', hex: '#B28DFF', hexLight: '#C3A6FF' },
    { id: 'pink', hex: '#FF8FC9', hexLight: '#FFAED5' },
]

const FALLBACK_VOICE: IVoiceColor = { id: 'coral', hex: '#FF7766', hexLight: '#FF968A' }

export const INK_COLOR = '#1E1A3F'
export const CREAM_COLOR = '#FFF3DC'

export const getVoiceColor = (id: VoiceColorId): IVoiceColor => {
    return VOICE_COLORS.find(color => color.id === id) ?? FALLBACK_VOICE
}

export const MESSAGE_MAX_DURATION_MS = 120000
export const MESSAGE_LISTEN_WINDOW_HOURS = 24
export const MESSAGE_MAX_ACTIVE = 5
export const TREASURE_LIMIT = 10

export const ALL_RECIPIENTS_ID = 'all'
