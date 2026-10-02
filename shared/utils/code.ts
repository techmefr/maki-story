export const PIN_MIN_LENGTH = 4
export const PIN_MAX_LENGTH = 8
export const SYMBOL_CODE_LENGTH = 4

export const SYMBOLS: ISymbol[] = [
    { id: 0, shape: 'star', color: 'coral' },
    { id: 1, shape: 'moon', color: 'sky' },
    { id: 2, shape: 'heart', color: 'mint' },
    { id: 3, shape: 'sun', color: 'sun' },
    { id: 4, shape: 'cloud', color: 'grape' },
    { id: 5, shape: 'flower', color: 'pink' },
]

const PIN_PATTERN = new RegExp(`^[0-9]{${PIN_MIN_LENGTH},${PIN_MAX_LENGTH}}$`)
const SYMBOL_PATTERN = new RegExp(`^[0-${SYMBOLS.length - 1}]{${SYMBOL_CODE_LENGTH}}$`)

export const isValidCodeValue = (kind: MemberCodeKind, value: unknown): value is string => {
    if (typeof value !== 'string') {
        return false
    }
    return kind === 'pin' ? PIN_PATTERN.test(value) : SYMBOL_PATTERN.test(value)
}

export const isMemberCodeKind = (value: unknown): value is MemberCodeKind => value === 'pin' || value === 'symbols'

export const isCodeKindAllowed = (kind: MemberCodeKind, role: MemberRole): boolean => role === 'child' || kind === 'pin'
