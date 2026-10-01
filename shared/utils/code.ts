export const PIN_MIN_LENGTH = 4
export const PIN_MAX_LENGTH = 6
export const SHAPE_CODE_LENGTH = 3

export const SHAPES: { id: number; label: string }[] = [
    { id: 0, label: 'Cercle' },
    { id: 1, label: 'Carré' },
    { id: 2, label: 'Triangle' },
    { id: 3, label: 'Étoile' },
]

const PIN_PATTERN = new RegExp(`^[0-9]{${PIN_MIN_LENGTH},${PIN_MAX_LENGTH}}$`)
const SHAPE_PATTERN = /^[0-3]{3}$/

export const isValidCodeValue = (kind: MemberCodeKind, value: unknown): value is string => {
    if (typeof value !== 'string') {
        return false
    }
    if (kind === 'pin') {
        return PIN_PATTERN.test(value)
    }
    return SHAPE_PATTERN.test(value) && new Set(value).size === SHAPE_CODE_LENGTH
}

export const isMemberCodeKind = (value: unknown): value is MemberCodeKind => value === 'pin' || value === 'shapes'
