export interface IBiometricBridge {
    isAvailable: () => Promise<boolean>
    verify: (reason: string) => Promise<boolean>
    saveSecret: (key: string, id: string, secret: string) => Promise<void>
    readSecret: (key: string) => Promise<IDeviceProof | null>
    deleteSecret: (key: string) => Promise<void>
}

const SERVER_PREFIX = 'app.tantara.mobile.device'

const createNativeBridge = async (): Promise<IBiometricBridge> => {
    const { NativeBiometric } = await import('@capgo/capacitor-native-biometric')
    const server = (key: string): string => `${SERVER_PREFIX}.${key}`
    return {
        isAvailable: async () => (await NativeBiometric.isAvailable()).isAvailable,
        verify: async reason => {
            try {
                await NativeBiometric.verifyIdentity({ reason, title: 'Maki Story', useFallback: false })
                return true
            } catch (_error) {
                return false
            }
        },
        saveSecret: (key, id, secret) => NativeBiometric.setCredentials({ username: id, password: secret, server: server(key) }),
        readSecret: async key => {
            try {
                const { username, password } = await NativeBiometric.getCredentials({ server: server(key) })
                return username && password ? { id: username, secret: password } : null
            } catch (_error) {
                return null
            }
        },
        deleteSecret: async key => {
            try {
                await NativeBiometric.deleteCredentials({ server: server(key) })
            } catch (_error) {
                console.warn('Le secret de l’appareil n’a pas pu être supprimé')
            }
        },
    }
}

const isNativePlatform = async (): Promise<boolean> => {
    const { Capacitor } = await import('@capacitor/core')
    return Capacitor.isNativePlatform()
}

let cached: Promise<IBiometricBridge | null> | null = null

export const loadBiometricBridge = (allowInjected: boolean): Promise<IBiometricBridge | null> => {
    cached ??= (async () => {
        const injected = (globalThis as { __TANTARA_BIOMETRIC__?: IBiometricBridge }).__TANTARA_BIOMETRIC__
        if (allowInjected && injected) {
            return injected
        }
        try {
            return (await isNativePlatform()) ? await createNativeBridge() : null
        } catch (_error) {
            return null
        }
    })()
    return cached
}
