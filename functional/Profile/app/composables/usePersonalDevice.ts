const STORAGE_KEY = 'tantara-personal-device'
const PERSONAL_LABEL_MAX = 60

const isPersonalDevice = (value: unknown): value is IPersonalDevice => {
    const candidate = (value ?? {}) as Partial<IPersonalDevice>
    return [candidate.id, candidate.secret, candidate.memberId].every(field => typeof field === 'string' && field !== '')
}

const readStored = (): IPersonalDevice | null => {
    try {
        const parsed: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? 'null')
        return isPersonalDevice(parsed) ? parsed : null
    } catch (_error) {
        return null
    }
}

const writeStored = (device: IPersonalDevice | null): void => {
    try {
        if (device) {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(device))
        } else {
            window.localStorage.removeItem(STORAGE_KEY)
        }
    } catch (_error) {
        throw new Error('Device storage is unavailable')
    }
}

export const usePersonalDevice = () => {
    const { request } = useApi()
    const { t } = useI18n()
    const stored = useState<IPersonalDevice | null>('personal-device', () => (import.meta.client ? readStored() : null))
    const isReleased = useState<boolean>('personal-device-released', () => false)
    const gateNext = useState<string | null>('personal-device-gate-next', () => null)

    const isPersonal = computed(() => stored.value !== null)
    const isPersonalFor = (memberId: string | null): boolean => memberId !== null && stored.value?.memberId === memberId

    const enable = async (memberId: string): Promise<void> => {
        const device = await request<IDeviceEnrolment>('/devices', {
            method: 'POST',
            body: { label: t('personalDevice.label').slice(0, PERSONAL_LABEL_MAX), isPersonal: true },
        })
        const record: IPersonalDevice = { id: device.id, secret: device.secret, memberId }
        try {
            writeStored(record)
        } catch (error) {
            await request(`/devices/${device.id}`, { method: 'DELETE' })
            throw error
        }
        stored.value = record
        isReleased.value = true
    }

    const forget = (): void => {
        try {
            writeStored(null)
        } catch (_error) {
            stored.value = null
        }
        stored.value = null
        isReleased.value = false
    }

    const disable = async (): Promise<void> => {
        const record = stored.value
        forget()
        if (record) {
            await request(`/devices/${record.id}`, { method: 'DELETE' })
        }
    }

    const release = (): void => {
        isReleased.value = true
    }

    const relock = (): void => {
        isReleased.value = false
    }

    return { stored, isPersonal, isPersonalFor, isReleased, gateNext, enable, disable, forget, release, relock }
}
