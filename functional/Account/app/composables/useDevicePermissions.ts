export type TPermissionKind = 'mic' | 'camera' | 'notifications'
export type TPermissionState = 'idle' | 'granted' | 'denied' | 'unsupported'

const MEDIA_CONSTRAINTS: Record<'mic' | 'camera', MediaStreamConstraints> = {
    mic: { audio: true },
    camera: { video: true },
}

const QUERY_NAMES: Record<TPermissionKind, string> = { mic: 'microphone', camera: 'camera', notifications: 'notifications' }

const askMedia = async (kind: 'mic' | 'camera'): Promise<TPermissionState> => {
    if (!navigator.mediaDevices?.getUserMedia) {
        return 'unsupported'
    }
    try {
        const stream = await navigator.mediaDevices.getUserMedia(MEDIA_CONSTRAINTS[kind])
        stream.getTracks().forEach(track => track.stop())
        return 'granted'
    } catch (_error) {
        return 'denied'
    }
}

const askNotifications = async (): Promise<TPermissionState> => {
    if (typeof Notification === 'undefined') {
        return 'unsupported'
    }
    const result = await Notification.requestPermission()
    return result === 'granted' ? 'granted' : result === 'denied' ? 'denied' : 'idle'
}

const readState = async (kind: TPermissionKind): Promise<TPermissionState> => {
    if (kind === 'notifications' && typeof Notification === 'undefined') {
        return 'unsupported'
    }
    try {
        const status = await navigator.permissions.query({ name: QUERY_NAMES[kind] as PermissionName })
        return status.state === 'granted' ? 'granted' : status.state === 'denied' ? 'denied' : 'idle'
    } catch (_error) {
        return 'idle'
    }
}

export const useDevicePermissions = () => {
    const states = ref<Record<TPermissionKind, TPermissionState>>({ mic: 'idle', camera: 'idle', notifications: 'idle' })

    const refresh = async (): Promise<void> => {
        const kinds: TPermissionKind[] = ['mic', 'camera', 'notifications']
        const read = await Promise.all(kinds.map(readState))
        kinds.forEach((kind, position) => {
            states.value[kind] = read[position] ?? 'idle'
        })
    }

    const ask = async (kind: TPermissionKind): Promise<void> => {
        states.value[kind] = kind === 'notifications' ? await askNotifications() : await askMedia(kind)
    }

    return { states, refresh, ask }
}
