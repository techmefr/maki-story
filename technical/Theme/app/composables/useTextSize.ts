export const TEXT_SIZES = [
    { id: 'normal', scale: 1 },
    { id: 'large', scale: 1.25 },
    { id: 'xlarge', scale: 1.6 },
    { id: 'huge', scale: 2 },
    { id: 'max', scale: 2.5 },
] as const

export type TTextSizeId = (typeof TEXT_SIZES)[number]['id']

const DEVICE_KEY = 'tantara-text-size'
const memberKey = (memberId: string): string => `${DEVICE_KEY}:${memberId}`

const isTextSizeId = (value: string | null): value is TTextSizeId => TEXT_SIZES.some(size => size.id === value)

const readStored = (key: string): TTextSizeId | null => {
    try {
        const value = localStorage.getItem(key)
        return isTextSizeId(value) ? value : null
    } catch (_error) {
        return null
    }
}

const writeStored = (key: string, value: TTextSizeId): void => {
    try {
        localStorage.setItem(key, value)
    } catch (_error) {
        return
    }
}

export const useTextSize = () => {
    const sizeId = useState<TTextSizeId>('text-size', () => 'normal')
    const { currentId } = useCurrentMember()

    const apply = (id: TTextSizeId): void => {
        const size = TEXT_SIZES.find(item => item.id === id) ?? TEXT_SIZES[0]
        document.documentElement.style.setProperty('--text-scale', String(size.scale))
        document.documentElement.dataset.textSize = size.id
    }

    const restore = (): void => {
        const stored = (currentId.value ? readStored(memberKey(currentId.value)) : null) ?? readStored(DEVICE_KEY) ?? 'normal'
        sizeId.value = stored
        apply(stored)
    }

    const choose = (id: TTextSizeId): void => {
        sizeId.value = id
        writeStored(DEVICE_KEY, id)
        if (currentId.value) {
            writeStored(memberKey(currentId.value), id)
        }
        apply(id)
    }

    return { sizeId, sizes: TEXT_SIZES, restore, choose }
}
