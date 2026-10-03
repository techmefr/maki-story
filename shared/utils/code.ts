export const PIN_MIN_LENGTH = 4
export const PIN_MAX_LENGTH = 8
export const SYMBOL_MIN_LENGTH = 4
export const SYMBOL_MAX_LENGTH = 6

export const SYMBOLS: ISymbol[] = [
    { id: 0, shape: 'star', fill: '#FFC933' },
    { id: 1, shape: 'circle', fill: '#FF6B5E' },
    { id: 2, shape: 'heart', fill: '#FF8FC1' },
    { id: 3, shape: 'square', fill: '#4DA3FF' },
    { id: 4, shape: 'triangle', fill: '#4CC98A' },
    { id: 5, shape: 'diamond', fill: '#A66BFF' },
]

const PIN_PATTERN = new RegExp(`^[0-9]{${PIN_MIN_LENGTH},${PIN_MAX_LENGTH}}$`)
const SYMBOL_PATTERN = new RegExp(`^[0-${SYMBOLS.length - 1}]{${SYMBOL_MIN_LENGTH},${SYMBOL_MAX_LENGTH}}$`)

export const isValidCodeValue = (kind: MemberCodeKind, value: unknown): value is string => {
    if (typeof value !== 'string') {
        return false
    }
    return kind === 'pin' ? PIN_PATTERN.test(value) : SYMBOL_PATTERN.test(value)
}

export const isMemberCodeKind = (value: unknown): value is MemberCodeKind => value === 'pin' || value === 'symbols'

export const isCodeKindAllowed = (kind: MemberCodeKind, role: MemberRole): boolean => role === 'child' || kind === 'pin'
