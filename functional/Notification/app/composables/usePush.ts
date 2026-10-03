interface INativePush {
    requestPermissions: () => Promise<{ receive: string }>
    register: () => Promise<void>
    addListener: (event: string, handler: (payload: { value: string }) => void) => Promise<unknown>
}

interface ICapacitorGlobal {
    isNativePlatform?: () => boolean
    getPlatform?: () => string
    Plugins?: { PushNotifications?: INativePush }
}

const toKey = (value: string): Uint8Array<ArrayBuffer> => {
    const padded = value.padEnd(value.length + ((4 - (value.length % 4)) % 4), '=').replace(/-/g, '+').replace(/_/g, '/')
    const raw = atob(padded)
    const bytes = new Uint8Array(new ArrayBuffer(raw.length))
    for (let index = 0; index < raw.length; index++) {
        bytes[index] = raw.charCodeAt(index)
    }
    return bytes
}

export type PushState = 'unsupported' | 'denied' | 'off' | 'on'

export const usePush = () => {
    const { request } = useApi()
    const state = useState<PushState>('push-state', () => 'unsupported')

    const capacitor = (): ICapacitorGlobal | null => (window as unknown as { Capacitor?: ICapacitorGlobal }).Capacitor ?? null

    const nativePlugin = (): INativePush | null => {
        const bridge = capacitor()
        return bridge?.isNativePlatform?.() ? (bridge.Plugins?.PushNotifications ?? null) : null
    }

    const refresh = async (): Promise<void> => {
        if (nativePlugin()) {
            state.value = 'off'
            return
        }
        if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
            state.value = 'unsupported'
            return
        }
        if (Notification.permission === 'denied') {
            state.value = 'denied'
            return
        }
        const registration = await navigator.serviceWorker.getRegistration()
        const subscription = registration ? await registration.pushManager.getSubscription() : null
        state.value = subscription && Notification.permission === 'granted' ? 'on' : 'off'
    }

    const enableNative = async (plugin: INativePush): Promise<boolean> => {
        const permission = await plugin.requestPermissions()
        if (permission.receive !== 'granted') {
            state.value = 'denied'
            return false
        }
        const platform = capacitor()?.getPlatform?.() === 'ios' ? 'IOS' : 'ANDROID'
        await plugin.addListener('registration', payload => {
            void request('/push/subscriptions', { method: 'POST', body: { platform, endpoint: payload.value } })
        })
        await plugin.register()
        state.value = 'on'
        return true
    }

    const enableWeb = async (): Promise<boolean> => {
        const config = await request<IPushConfig>('/push/config')
        if (!config.isWebEnabled || config.webPublicKey === '') {
            state.value = 'unsupported'
            return false
        }
        if ((await Notification.requestPermission()) !== 'granted') {
            state.value = 'denied'
            return false
        }
        const registration = await navigator.serviceWorker.ready
        const subscription =
            (await registration.pushManager.getSubscription()) ??
            (await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toKey(config.webPublicKey) }))
        const json = subscription.toJSON()
        await request('/push/subscriptions', { method: 'POST', body: { platform: 'WEB', endpoint: subscription.endpoint, keys: json.keys ?? {} } })
        state.value = 'on'
        return true
    }

    const enable = async (): Promise<boolean> => {
        const plugin = nativePlugin()
        return plugin ? enableNative(plugin) : enableWeb()
    }

    const disable = async (): Promise<void> => {
        const registration = await navigator.serviceWorker?.getRegistration()
        const subscription = registration ? await registration.pushManager.getSubscription() : null
        if (subscription) {
            await request('/push/subscriptions', { method: 'DELETE', body: { endpoint: subscription.endpoint } })
            await subscription.unsubscribe()
        }
        state.value = 'off'
    }

    const loadPreferences = (): Promise<INotificationPreference[]> => request<INotificationPreference[]>('/notifications/preferences')

    const setPreference = (preference: INotificationPreference): Promise<INotificationPreference> =>
        request<INotificationPreference>('/notifications/preferences', { method: 'PUT', body: preference })

    return { state, refresh, enable, disable, loadPreferences, setPreference }
}
