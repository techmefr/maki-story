export type SoundCue = 'button' | 'navigation' | 'success' | 'error' | 'page-turn' | 'message'

export interface IToneStep {
    frequency: number
    delay: number
    length: number
    type: OscillatorType
    gain: number
    glideTo?: number
    clickGain?: number
}

export const SOUND_CUES: SoundCue[] = ['button', 'navigation', 'success', 'error', 'page-turn', 'message']

const C5 = 523.25
const D5 = 587.33
const E5 = 659.25
const G5 = 783.99
const A5 = 880
const C6 = 1046.5
const E6 = 1318.5

export const CUE_TONES: Record<SoundCue, IToneStep[]> = {
    button: [{ frequency: G5, glideTo: C5 * 1.1, delay: 0, length: 0.07, type: 'triangle', gain: 0.55, clickGain: 0.5 }],
    navigation: [
        { frequency: E5, delay: 0, length: 0.11, type: 'triangle', gain: 0.55, clickGain: 0.25 },
        { frequency: G5, delay: 0.07, length: 0.14, type: 'triangle', gain: 0.55 },
    ],
    success: [
        { frequency: C5, delay: 0, length: 0.16, type: 'triangle', gain: 0.55, clickGain: 0.2 },
        { frequency: E5, delay: 0.12, length: 0.16, type: 'triangle', gain: 0.55 },
        { frequency: G5, delay: 0.24, length: 0.16, type: 'triangle', gain: 0.55 },
        { frequency: C6, delay: 0.36, length: 0.24, type: 'triangle', gain: 0.6 },
    ],
    error: [{ frequency: 196, glideTo: 130, delay: 0, length: 0.2, type: 'sine', gain: 0.6, clickGain: 0.3 }],
    'page-turn': [{ frequency: 300, glideTo: 640, delay: 0, length: 0.24, type: 'sine', gain: 0.5, clickGain: 0.15 }],
    message: [
        { frequency: G5, delay: 0, length: 0.12, type: 'sine', gain: 0.5 },
        { frequency: C6, delay: 0.09, length: 0.12, type: 'sine', gain: 0.5 },
        { frequency: E6, delay: 0.18, length: 0.2, type: 'sine', gain: 0.45 },
    ],
}

export const DEFAULT_CUE_VOLUME = 0.6
export const PITCH_VARIATION_CENTS = 15

export const clampVolume = (value: number): number => Math.min(1, Math.max(0, Number.isFinite(value) ? value : DEFAULT_CUE_VOLUME))

const randomCents = (): number => (Math.random() * 2 - 1) * PITCH_VARIATION_CENTS

const noiseBuffer = (context: AudioContext, length: number): AudioBuffer => {
    const buffer = context.createBuffer(1, Math.max(1, Math.floor(context.sampleRate * length)), context.sampleRate)
    const data = buffer.getChannelData(0)
    for (let index = 0; index < data.length; index++) {
        data[index] = Math.random() * 2 - 1
    }
    return buffer
}

const playClick = (context: AudioContext, start: number, level: number): void => {
    const source = context.createBufferSource()
    const filter = context.createBiquadFilter()
    const gain = context.createGain()
    source.buffer = noiseBuffer(context, 0.025)
    filter.type = 'bandpass'
    filter.frequency.value = 2200
    gain.gain.setValueAtTime(level, start)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.025)
    source.connect(filter)
    filter.connect(gain)
    gain.connect(context.destination)
    source.start(start)
}

export const synthesizeCue = (context: AudioContext, cue: SoundCue, volume: number): void => {
    const now = context.currentTime
    const cents = randomCents()
    const detune = 2 ** (cents / 1200)
    for (const step of CUE_TONES[cue]) {
        const oscillator = context.createOscillator()
        const gain = context.createGain()
        const start = now + step.delay
        const level = step.gain * volume * 0.5
        oscillator.type = step.type
        oscillator.frequency.setValueAtTime(step.frequency * detune, start)
        if (step.glideTo) {
            oscillator.frequency.exponentialRampToValueAtTime(step.glideTo * detune, start + step.length * 0.8)
        }
        gain.gain.setValueAtTime(0.0001, start)
        gain.gain.exponentialRampToValueAtTime(level, start + 0.004)
        gain.gain.exponentialRampToValueAtTime(0.0001, start + step.length)
        oscillator.connect(gain)
        gain.connect(context.destination)
        oscillator.start(start)
        oscillator.stop(start + step.length + 0.05)
        if (step.clickGain) {
            playClick(context, start, step.clickGain * volume * 0.5)
        }
    }
}
