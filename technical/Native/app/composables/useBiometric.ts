const DECLINED_KEY = 'tantara-biometric-declined'

const readDeclined = (): string[] => {
    try {
        return JSON.parse(window.sessionStorage.getItem(DECLINED_KEY) ?? '[]') as string[]
    } catch (_error) {
        return []
    }
}

export const useBiometric = () => {
    const config = useRuntimeConfig()
    const { t } = useI18n()
    const { request } = useApi()
    const isSupported = useState<boolean>('biometric-supported', () => false)

    const deviceLabel = (): string => {
        const agent = navigator.userAgent
        if (/iPhone|iPad|iPod/.test(agent)) {
            return t('auth.biometric.deviceApple')
        }
        return /Android/.test(agent) ? t('auth.biometric.deviceAndroid') : t('auth.biometric.deviceOther')
    }

    const bridge = (): Promise<IBiometricBridge | null> => loadBiometricBridge(Boolean(config.public.biometricTestBridge))

    const detect = async (): Promise<boolean> => {
        const native = await bridge()
        let isAvailable = false
        if (native) {
            try {
                isAvailable = await native.isAvailable()
            } catch (_error) {
                isAvailable = false
            }
        }
        isSupported.value = isAvailable
        return isAvailable
    }

    const isEnrolled = async (memberId: string): Promise<boolean> => {
        const native = await bridge()
        return native !== null && (await native.readSecret(memberId)) !== null
    }

    const isDeclined = (memberId: string): boolean => readDeclined().includes(memberId)

    const decline = (memberId: string): void => {
        try {
            window.sessionStorage.setItem(DECLINED_KEY, JSON.stringify([...readDeclined(), memberId]))
        } catch (_error) {
            console.warn('Le stockage de session est indisponible')
        }
    }

    const forget = async (memberId: string): Promise<void> => {
        await (await bridge())?.deleteSecret(memberId)
    }

    const enrol = async (memberId: string): Promise<boolean> => {
        const native = await bridge()
        if (!native || !(await native.verify(t('auth.biometric.reason')))) {
            return false
        }
        const device = await request<IDeviceEnrolment>('/devices', { method: 'POST', body: { label: deviceLabel() } })
        try {
            await native.saveSecret(memberId, device.id, device.secret)
        } catch (error) {
            await request(`/devices/${device.id}`, { method: 'DELETE' })
            throw error
        }
        return true
    }

    const prove = async (memberId: string): Promise<IProfileProof | null> => {
        const native = await bridge()
        if (!native || !(await native.verify(t('auth.biometric.reason')))) {
            return null
        }
        const device = await native.readSecret(memberId)
        return device ? { device } : null
    }

    const unlocker: IProfileUnlocker = {
        id: 'biometric',
        get label() {
            return t('auth.biometric.unlocker')
        },
        isAvailable: async memberId => (await detect()) && (await isEnrolled(memberId)),
        prove,
    }

    return { isSupported, detect, isEnrolled, isDeclined, decline, forget, enrol, prove, unlocker }
}
