export type TMessage = string | Record<string, string>
export type TMessages = Record<string, TMessage>
export type TParams = Record<string, string | number>

const PLURAL_CATEGORIES = ['zero', 'one', 'two', 'few', 'many', 'other']

export const flattenMessages = (tree: Record<string, unknown>, prefix = '', out: TMessages = {}): TMessages => {
    for (const [key, value] of Object.entries(tree)) {
        const path = prefix ? `${prefix}.${key}` : key
        if (typeof value === 'string') {
            out[path] = value
        } else if (value && typeof value === 'object') {
            const entries = Object.keys(value)
            if (entries.length > 0 && entries.every(entry => PLURAL_CATEGORIES.includes(entry))) {
                out[path] = value as Record<string, string>
            } else {
                flattenMessages(value as Record<string, unknown>, path, out)
            }
        }
    }
    return out
}

export const interpolate = (template: string, params: TParams = {}): string =>
    template.replace(/\{(\w+)\}/g, (match, name: string) => (name in params ? String(params[name]) : match))

export const pickPlural = (message: TMessage, locale: string, params: TParams = {}): string => {
    if (typeof message === 'string') {
        return message
    }
    const count = Number(params.count ?? 0)
    if (count === 0 && message.zero) {
        return message.zero
    }
    const category = new Intl.PluralRules(locale).select(count)
    return message[category] ?? message.other ?? Object.values(message)[0] ?? ''
}

export const translateMessage = (message: TMessage | undefined, locale: string, params?: TParams): string | null =>
    message === undefined ? null : interpolate(pickPlural(message, locale, params), params)
