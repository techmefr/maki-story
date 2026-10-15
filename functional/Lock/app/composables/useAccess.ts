const ALLOWED_STATUS: IAccessStatus = { isAllowed: true, reason: null, resumeAt: null }
const CACHE_KEY = 'tantara-access'
export const ACCESS_CLOSING_EVENT = 'tantara-access-closing'
export const ACCESS_FADE_MS = 1400

interface IAccessCache {
    memberId: string
    schedule: IChildSchedule | null
    controls: IAccessControls | null
    overrideUntil: string | null
}

const readCache = (): IAccessCache | null => {
    try {
        const raw = localStorage.getItem(CACHE_KEY)
        return raw ? (JSON.parse(raw) as IAccessCache) : null
    } catch (_error) {
        return null
    }
}

const writeCache = (cache: IAccessCache): void => {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
    } catch (_error) {
        return
    }
}

export const useAccess = () => {
    const config = useRuntimeConfig()
    const { request } = useApi()
    const { currentId } = useCurrentMember()
    const status = useState<IAccessStatus>('access-status', () => ALLOWED_STATUS)
    const overrideUntil = useState<string | null>('access-override-until', () => null)
    const homework = useState<THomeworkGate>('access-homework', () => 'none')
    const nightStartsAt = useState<string | null>('access-night-starts-at', () => null)

    const apply = (snapshot: IAccessSnapshot): void => {
        status.value = { isAllowed: snapshot.isAllowed, reason: snapshot.reason, resumeAt: snapshot.resumeAt }
        overrideUntil.value = snapshot.overrideUntil
        homework.value = snapshot.homework
        nightStartsAt.value = snapshot.nightStartsAt
        if (currentId.value) {
            writeCache({ memberId: currentId.value, schedule: snapshot.schedule, controls: snapshot.controls, overrideUntil: snapshot.overrideUntil })
        }
    }

    const evaluateLocally = (): IAccessStatus | null => {
        const cache = readCache()
        if (!cache || cache.memberId !== currentId.value) {
            return null
        }
        if (cache.overrideUntil && Date.parse(cache.overrideUntil) > Date.now()) {
            return ALLOWED_STATUS
        }
        const deviceZone = Intl.DateTimeFormat().resolvedOptions().timeZone
        const zoneOf = (fallback: string): string => (isValidTimezone(deviceZone) ? deviceZone : fallback)
        const verdict = evaluateControls(cache.controls ? { ...cache.controls, timezone: zoneOf(cache.controls.timezone) } : null, Date.now())
        if (verdict.reason) {
            return { isAllowed: false, reason: verdict.reason, resumeAt: verdict.resumeAt }
        }
        if (!cache.schedule) {
            return ALLOWED_STATUS
        }
        return evaluateAccess({ ...cache.schedule, timezone: zoneOf(cache.schedule.timezone) }, Date.now())
    }

    const refresh = async (): Promise<IAccessStatus> => {
        try {
            apply(await $fetch<IAccessSnapshot>(`${config.public.apiBase}/api/access`, { credentials: 'include' }))
        } catch (_error) {
            const local = evaluateLocally()
            if (local) {
                status.value = local
            } else {
                console.warn('L accès horaire n a pas pu être vérifié')
            }
        }
        return status.value
    }

    const askParents = async (): Promise<void> => {
        await request<IHomeworkReply>('/access/request', { method: 'POST' })
    }

    const unlockWithParent = async (parentId: string, code: string): Promise<void> => {
        apply(await request<IAccessSnapshot>('/access/override', { method: 'POST', body: { parentId, code } }))
    }

    const markLocked = (): void => {
        status.value = { isAllowed: false, reason: 'schedule', resumeAt: status.value.resumeAt }
    }

    const reset = (): void => {
        status.value = ALLOWED_STATUS
        homework.value = 'none'
        nightStartsAt.value = null
    }

    return { status, overrideUntil, homework, nightStartsAt, askParents, refresh, unlockWithParent, markLocked, reset }
}
